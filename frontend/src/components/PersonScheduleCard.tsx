import type { CSSProperties } from 'react';
import { formatShortDate, formatTimeRange } from '../lib/calendar';
import { Person, PersonSlug, Schedule } from '../types';

interface PersonScheduleCardProps {
  person: Person;
  schedules: Schedule[];
  selectedFilter: PersonSlug;
}

export function PersonScheduleCard({ person, schedules, selectedFilter }: PersonScheduleCardProps) {
  const isActive = selectedFilter === 'all' || selectedFilter === person.slug;
  const cardStyle = {
    '--accent': person.color
  } as CSSProperties;

  return (
    <article className={isActive ? 'person-card' : 'person-card muted'} style={cardStyle}>
      <div className="person-card-header">
        <div>
          <h3>{person.name}</h3>
        </div>
        <span className="badge">{schedules.length}개</span>
      </div>

      <div className="person-card-list">
        {schedules.length > 0 ? (
          schedules.map((schedule) => (
            <div key={schedule.id} className="person-schedule-row">
              <div>
                <strong>{schedule.title}</strong>
                <p>{formatShortDate(schedule.startAt)}</p>
              </div>
              <div className="person-schedule-side">
                <span>{formatTimeRange(schedule.startAt, schedule.endAt)}</span>
                {schedule.location ? <small>{schedule.location}</small> : null}
                {schedule.source === 'GOOGLE_CALENDAR' ? <small>Google Calendar</small> : null}
              </div>
            </div>
          ))
        ) : (
          <div className="person-empty">
            {person.slug === 'piljae' || person.slug === 'onyu'
              ? 'Google Calendar 또는 DB에 이번 주 일정이 없습니다.'
              : '이번 주 등록된 일정이 없습니다.'}
          </div>
        )}
      </div>
    </article>
  );
}
