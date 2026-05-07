import { getSchedulesForDay, formatDayLabel, formatTimeRange } from '../lib/calendar';
import { Schedule } from '../types';

interface WeeklyCalendarProps {
  days: Date[];
  schedules: Schedule[];
  onDeleteSchedule?: (scheduleId: string) => void;
}

export function WeeklyCalendar({ days, schedules, onDeleteSchedule }: WeeklyCalendarProps) {
  return (
    <div className="week-grid-wrapper">
      <div className="week-grid">
        {days.map((day) => {
          const daySchedules = getSchedulesForDay(schedules, day);

          return (
            <section key={day.toISOString()} className="day-column">
              <header className="day-header">
                <span>{formatDayLabel(day)}</span>
                <strong>{daySchedules.length}개 일정</strong>
              </header>

              <div className="day-content">
                {daySchedules.length > 0 ? (
                  daySchedules.map((schedule) => (
                    <article
                      key={schedule.id}
                      className="schedule-item"
                      style={{ borderColor: `${schedule.color}66` }}
                    >
                      <div className="schedule-meta" style={{ color: schedule.color }}>
                        <span className="dot" style={{ backgroundColor: schedule.color }} />
                        {schedule.personName}
                      </div>
                      <h3>{schedule.title}</h3>
                      <p>{formatTimeRange(schedule.startAt, schedule.endAt)}</p>
                      {schedule.source === 'DB' && onDeleteSchedule ? (
                        <button
                          type="button"
                          className="schedule-delete-button"
                          onClick={() => onDeleteSchedule(schedule.id)}
                        >
                          삭제
                        </button>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <div className="empty-slot">등록된 일정이 없습니다.</div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
