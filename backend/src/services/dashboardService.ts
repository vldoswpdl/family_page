import { Prisma, ScheduleSource } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { getSeoulWeekRange, SEOUL_TIMEZONE } from '../lib/time';
import { DashboardPerson, DashboardSchedule, PersonSlug } from '../types/dashboard';
import { fetchGoogleSchedules, isGoogleCalendarConfiguredForPerson } from './googleCalendar';

type PersonFilter = 'all' | PersonSlug;
type ScheduleWithPerson = Prisma.ScheduleGetPayload<{
  include: {
    person: true;
  };
}>;

const PERSON_FILTERS = new Set<PersonFilter>(['all', 'piljae', 'byunghyun', 'onyu']);
const MAX_RECURRING_WEEKS = 104;

function normalizePersonFilter(value?: string): PersonFilter {
  if (value && PERSON_FILTERS.has(value as PersonFilter)) {
    return value as PersonFilter;
  }

  return 'all';
}

function mapDbScheduleToView(schedule: ScheduleWithPerson): DashboardSchedule {
  return {
    id: `db-${schedule.id}`,
    title: schedule.title,
    description: schedule.description,
    location: schedule.location,
    startAt: schedule.startAt.toISOString(),
    endAt: schedule.endAt.toISOString(),
    source: schedule.source as DashboardSchedule['source'],
    personId: schedule.person.id,
    personName: schedule.person.name,
    personSlug: schedule.person.slug as PersonSlug,
    color: schedule.person.color
  };
}

export async function getDashboardData(personFilterInput?: string, dateInput?: string) {
  const personFilter = normalizePersonFilter(personFilterInput);
  const { weekStart, weekEnd, label } = getSeoulWeekRange(dateInput);

  const people = await prisma.person.findMany({
    orderBy: {
      id: 'asc'
    }
  });

  const dashboardPeople: DashboardPerson[] = people.map((person) => ({
    id: person.id,
    name: person.name,
    slug: person.slug as PersonSlug,
    color: person.color
  }));

  const where: Prisma.ScheduleWhereInput = {
    startAt: {
      lte: weekEnd
    },
    endAt: {
      gte: weekStart
    }
  };

  if (personFilter !== 'all') {
    where.person = {
      slug: personFilter
    };
  }

  const dbSchedules = await prisma.schedule.findMany({
    where,
    include: {
      person: true
    },
    orderBy: {
      startAt: 'asc'
    }
  });

  const googleScheduleGroups = await Promise.all(
    dashboardPeople
      .filter((person) => personFilter === 'all' || person.slug === personFilter)
      .filter((person) => isGoogleCalendarConfiguredForPerson(person.slug))
      .map((person) => fetchGoogleSchedules(person, weekStart, weekEnd))
  );
  const googleSchedules = googleScheduleGroups.flat();

  const schedules = [...dbSchedules.map(mapDbScheduleToView), ...googleSchedules].sort((left, right) => {
    return new Date(left.startAt).getTime() - new Date(right.startAt).getTime();
  });

  return {
    timezone: SEOUL_TIMEZONE,
    week: {
      start: weekStart.toISOString(),
      end: weekEnd.toISOString(),
      label
    },
    people: dashboardPeople,
    schedules
  };
}

function parseRequiredString(value: unknown, label: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label}을 입력해 주세요.`);
  }

  return value.trim();
}

function parseOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function parseLocalDateTime(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    throw new Error('날짜와 시간을 올바르게 입력해 주세요.');
  }

  const parsed = new Date(`${date}T${time}:00+09:00`);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error('날짜와 시간을 올바르게 입력해 주세요.');
  }

  return parsed;
}

function addWeeks(date: Date, weeks: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + weeks * 7);
  return next;
}

export async function createDashboardSchedule(input: unknown) {
  const data = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  const personSlug = parseRequiredString(data.personSlug, '대상') as PersonFilter;
  const title = parseRequiredString(data.title, '일정 제목');
  const date = parseRequiredString(data.date, '날짜');
  const startTime = parseRequiredString(data.startTime, '시작 시간');
  const endTime = parseRequiredString(data.endTime, '종료 시간');
  const location = parseOptionalString(data.location);
  const description = parseOptionalString(data.description);
  const repeatWeekly = Boolean(data.repeatWeekly);
  const repeatUntil = typeof data.repeatUntil === 'string' && data.repeatUntil.trim() ? data.repeatUntil.trim() : date;

  if (!PERSON_FILTERS.has(personSlug)) {
    throw new Error('대상자를 올바르게 선택해 주세요.');
  }

  if (personSlug === 'all') {
    throw new Error('전체가 아닌 개인을 선택해 주세요.');
  }

  const person = await prisma.person.findUnique({
    where: {
      slug: personSlug as PersonSlug
    }
  });

  if (!person) {
    throw new Error('대상자를 찾을 수 없습니다.');
  }

  const firstStart = parseLocalDateTime(date, startTime);
  const firstEnd = parseLocalDateTime(date, endTime);

  if (firstEnd <= firstStart) {
    throw new Error('종료 시간은 시작 시간보다 늦어야 합니다.');
  }

  const repeatEnd = parseLocalDateTime(repeatUntil, '23:59');
  const weeks = repeatWeekly ? Math.floor((repeatEnd.getTime() - firstStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) : 0;
  const count = repeatWeekly ? Math.min(Math.max(weeks + 1, 1), MAX_RECURRING_WEEKS) : 1;

  const created = await prisma.$transaction(
    Array.from({ length: count }, (_, index) =>
      prisma.schedule.create({
        data: {
          title,
          description,
          location,
          startAt: addWeeks(firstStart, index),
          endAt: addWeeks(firstEnd, index),
          source: ScheduleSource.DB,
          personId: person.id
        },
        include: {
          person: true
        }
      })
    )
  );

  return {
    createdCount: created.length,
    schedules: created.map(mapDbScheduleToView)
  };
}
