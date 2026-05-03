export type PersonSlug = 'piljae' | 'byunghyun' | 'onyu';

export interface DashboardPerson {
  id: number;
  name: string;
  slug: PersonSlug;
  color: string;
}

export interface DashboardSchedule {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string;
  source: 'DB' | 'GOOGLE_CALENDAR';
  personId: number;
  personName: string;
  personSlug: PersonSlug;
  color: string;
}

