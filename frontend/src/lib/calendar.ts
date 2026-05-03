import { addDays, eachDayOfInterval, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { format } from 'date-fns';
import { Schedule } from '../types';

export function getWeekDays(weekStart: string) {
  const start = new Date(weekStart);
  return eachDayOfInterval({
    start,
    end: addDays(start, 6)
  });
}

export function getSchedulesForDay(schedules: Schedule[], day: Date) {
  return schedules.filter((schedule) => isSameDay(new Date(schedule.startAt), day));
}

export function formatDayLabel(day: Date) {
  return format(day, 'MM/dd (EEE)', { locale: ko });
}

export function formatTimeRange(startAt: string, endAt: string) {
  const start = format(new Date(startAt), 'HH:mm');
  const end = format(new Date(endAt), 'HH:mm');
  return `${start} - ${end}`;
}

export function formatShortDate(date: string) {
  return format(new Date(date), 'MM/dd (EEE)', { locale: ko });
}

