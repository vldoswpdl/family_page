import { endOfWeek, format, startOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export const SEOUL_TIMEZONE = 'Asia/Seoul';

export function getSeoulWeekRange(baseDate?: string) {
  const current = baseDate ? new Date(baseDate) : new Date();
  const seoulDate = toZonedTime(current, SEOUL_TIMEZONE);
  const weekStartLocal = startOfWeek(seoulDate, { weekStartsOn: 1 });
  const weekEndLocal = endOfWeek(seoulDate, { weekStartsOn: 1 });

  const weekStart = fromZonedTime(weekStartLocal, SEOUL_TIMEZONE);
  const weekEnd = fromZonedTime(weekEndLocal, SEOUL_TIMEZONE);

  const label = `${format(weekStartLocal, 'yyyy.MM.dd (EEE)', { locale: ko })} - ${format(
    weekEndLocal,
    'MM.dd (EEE)',
    { locale: ko }
  )}`;

  return {
    weekStart,
    weekEnd,
    label
  };
}

