import { randomUUID } from 'node:crypto';
import { google } from 'googleapis';
import { env, isGoogleCalendarConfigured } from '../config/env';
import { DashboardPerson, DashboardSchedule } from '../types/dashboard';

function getCalendarClient() {
  const auth = new google.auth.OAuth2(
    env.googleClientId,
    env.googleClientSecret,
    env.googleRedirectUri
  );

  auth.setCredentials({
    refresh_token: env.googleRefreshToken
  });

  return google.calendar({
    version: 'v3',
    auth
  });
}

function normalizeEventDate(value?: string | null, isEnd = false) {
  if (!value) {
    return null;
  }

  return new Date(`${value}T${isEnd ? '23:59:59' : '00:00:00'}+09:00`);
}

export async function fetchPiljaeGoogleSchedules(
  person: DashboardPerson,
  weekStart: Date,
  weekEnd: Date
): Promise<DashboardSchedule[]> {
  // The scaffold stays safe by returning no events until every OAuth value is set in `.env`.
  if (!isGoogleCalendarConfigured) {
    return [];
  }

  const calendar = getCalendarClient();
  const response = await calendar.events.list({
    calendarId: env.googleCalendarId,
    singleEvents: true,
    orderBy: 'startTime',
    timeMin: weekStart.toISOString(),
    timeMax: weekEnd.toISOString(),
    maxResults: 100
  });

  return (response.data.items ?? [])
    .filter((event) => event.start)
    .map((event) => {
      const startAt =
        event.start?.dateTime ? new Date(event.start.dateTime) : normalizeEventDate(event.start?.date);
      const endAt =
        event.end?.dateTime ? new Date(event.end.dateTime) : normalizeEventDate(event.end?.date, true);

      if (!startAt || !endAt) {
        return null;
      }

      return {
        id: `google-${event.id ?? randomUUID()}`,
        title: event.summary ?? '제목 없는 일정',
        description: event.description ?? null,
        location: event.location ?? null,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        source: 'GOOGLE_CALENDAR' as const,
        personId: person.id,
        personName: person.name,
        personSlug: person.slug,
        color: person.color
      };
    })
    .filter((event): event is DashboardSchedule => event !== null);
}
