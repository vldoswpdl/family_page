import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { getSeoulWeekRange, SEOUL_TIMEZONE } from '../lib/time';
import { DashboardPerson, DashboardSchedule, PersonSlug } from '../types/dashboard';
import { fetchPiljaeGoogleSchedules } from './googleCalendar';

type PersonFilter = 'all' | PersonSlug;
type ScheduleWithPerson = Prisma.ScheduleGetPayload<{
  include: {
    person: true;
  };
}>;

const PERSON_FILTERS = new Set<PersonFilter>(['all', 'piljae', 'byunghyun', 'onyu']);

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

  if (personFilter !== 'all' && personFilter !== 'piljae') {
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

  const piljae = dashboardPeople.find((person) => person.slug === 'piljae');
  const googleSchedules =
    piljae && (personFilter === 'all' || personFilter === 'piljae')
      ? await fetchPiljaeGoogleSchedules(piljae, weekStart, weekEnd)
      : [];

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
