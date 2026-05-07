export type PersonSlug = 'all' | 'piljae' | 'byunghyun' | 'onyu';

export interface Person {
  id: number;
  name: string;
  slug: Exclude<PersonSlug, 'all'>;
  color: string;
}

export interface Schedule {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string;
  source: 'DB' | 'GOOGLE_CALENDAR';
  personId: number;
  personName: string;
  personSlug: Exclude<PersonSlug, 'all'>;
  color: string;
}

export interface DashboardResponse {
  timezone: string;
  week: {
    start: string;
    end: string;
    label: string;
  };
  people: Person[];
  schedules: Schedule[];
}

export interface ScheduleCreateInput {
  personSlug: Exclude<PersonSlug, 'all'>;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  description?: string;
  repeatWeekly: boolean;
  repeatUntil?: string;
}
