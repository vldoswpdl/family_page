import { FormEvent, useMemo, useState } from 'react';
import { createSchedule } from '../lib/api';
import { Person, ScheduleCreateInput } from '../types';

interface ScheduleComposerProps {
  people: Person[];
  onCreated: () => Promise<void> | void;
}

function todayText() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
}

function addMonths(dateText: string, months: number) {
  const date = new Date(`${dateText}T00:00:00+09:00`);
  date.setMonth(date.getMonth() + months);
  return date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
}

export function ScheduleComposer({ people, onCreated }: ScheduleComposerProps) {
  const today = useMemo(() => todayText(), []);
  const [form, setForm] = useState<ScheduleCreateInput>({
    personSlug: people[0]?.slug ?? 'onyu',
    title: '',
    date: today,
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    description: '',
    repeatWeekly: false,
    repeatUntil: addMonths(today, 3)
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function update<K extends keyof ScheduleCreateInput>(key: K, value: ScheduleCreateInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const result = await createSchedule({
        ...form,
        repeatUntil: form.repeatWeekly ? form.repeatUntil : undefined
      });
      setMessage(`${result.createdCount}개의 일정이 추가되었습니다.`);
      setForm((current) => ({
        ...current,
        title: '',
        location: '',
        description: ''
      }));
      await onCreated();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '일정을 저장하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="schedule-composer" onSubmit={handleSubmit}>
      <div className="schedule-composer-head">
        <div>
          <h3>일정 추가</h3>
          <p>날짜별 일정과 매주 반복 일정을 개인별로 바로 추가합니다.</p>
        </div>
        {message ? <span className="schedule-message">{message}</span> : null}
      </div>

      <div className="schedule-form-grid">
        <label className="schedule-field">
          <span>대상</span>
          <select
            value={form.personSlug}
            onChange={(event) => update('personSlug', event.target.value as ScheduleCreateInput['personSlug'])}
          >
            {people.map((person) => (
              <option key={person.slug} value={person.slug}>
                {person.name}
              </option>
            ))}
          </select>
        </label>

        <label className="schedule-field title">
          <span>일정 제목</span>
          <input
            value={form.title}
            onChange={(event) => update('title', event.target.value)}
            placeholder="예: 학원, 병원, 가족 약속"
            required
          />
        </label>

        <label className="schedule-field">
          <span>날짜</span>
          <input type="date" value={form.date} onChange={(event) => update('date', event.target.value)} required />
        </label>

        <label className="schedule-field">
          <span>시작</span>
          <input
            type="time"
            value={form.startTime}
            onChange={(event) => update('startTime', event.target.value)}
            required
          />
        </label>

        <label className="schedule-field">
          <span>종료</span>
          <input type="time" value={form.endTime} onChange={(event) => update('endTime', event.target.value)} required />
        </label>

        <label className="schedule-field">
          <span>장소</span>
          <input value={form.location ?? ''} onChange={(event) => update('location', event.target.value)} />
        </label>

        <label className="schedule-field repeat">
          <span>반복</span>
          <label className="schedule-checkbox">
            <input
              type="checkbox"
              checked={form.repeatWeekly}
              onChange={(event) => update('repeatWeekly', event.target.checked)}
            />
            매주 반복
          </label>
        </label>

        <label className="schedule-field">
          <span>반복 종료일</span>
          <input
            type="date"
            value={form.repeatUntil ?? ''}
            onChange={(event) => update('repeatUntil', event.target.value)}
            disabled={!form.repeatWeekly}
          />
        </label>

        <label className="schedule-field memo">
          <span>메모</span>
          <textarea
            value={form.description ?? ''}
            onChange={(event) => update('description', event.target.value)}
            placeholder="준비물이나 참고할 내용을 적어둘 수 있어요."
          />
        </label>
      </div>

      <div className="schedule-form-actions">
        <button type="submit" disabled={saving}>
          {saving ? '저장 중...' : '일정 추가하기'}
        </button>
      </div>
    </form>
  );
}
