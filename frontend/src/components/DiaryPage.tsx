import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

interface DiaryEntry {
  id: string;
  date: string;
  text: string;
  imageDataUrl?: string;
  createdAt: string;
}

interface DiaryGroup {
  monthKey: string;
  monthLabel: string;
  entries: DiaryEntry[];
}

const STORAGE_KEY = 'onyu-page-diary';

const INITIAL_ENTRIES: DiaryEntry[] = [
  {
    id: 'seed-1',
    date: '2026-05-01',
    text: '아야진 스테이에 도착해서 짐을 풀고 바다를 보러 갔어요. 바람이 시원하고 모래놀이도 재미있었어요.',
    createdAt: '2026-05-01T18:00:00+09:00'
  },
  {
    id: 'seed-2',
    date: '2026-05-02',
    text: '가족이랑 맛있는 막국수를 먹고, 카페에 들렀다가 해변에서 또 신나게 놀았어요.',
    createdAt: '2026-05-02T20:00:00+09:00'
  }
];

function readEntries() {
  const saved = window.localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return INITIAL_ENTRIES;
  }

  try {
    const parsed = JSON.parse(saved) as DiaryEntry[];
    return parsed.length > 0 ? parsed : INITIAL_ENTRIES;
  } catch {
    return INITIAL_ENTRIES;
  }
}

function groupEntries(entries: DiaryEntry[]): DiaryGroup[] {
  const groups = new Map<string, DiaryEntry[]>();

  const sorted = [...entries].sort((left, right) => {
    return new Date(right.date).getTime() - new Date(left.date).getTime();
  });

  for (const entry of sorted) {
    const monthKey = format(parseISO(entry.date), 'yyyy-MM');
    const current = groups.get(monthKey) ?? [];
    current.push(entry);
    groups.set(monthKey, current);
  }

  return [...groups.entries()].map(([monthKey, monthEntries]) => ({
    monthKey,
    monthLabel: format(parseISO(`${monthKey}-01`), 'yyyy년 M월', { locale: ko }),
    entries: monthEntries
  }));
}

export function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [text, setText] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string>('');
  const [isComposerCollapsed, setIsComposerCollapsed] = useState(false);

  useEffect(() => {
    setEntries(readEntries());
  }, []);

  useEffect(() => {
    if (entries.length > 0) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }
  }, [entries]);

  const groups = useMemo(() => groupEntries(entries), [entries]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setImageDataUrl('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!text.trim()) {
      return;
    }

    const nextEntry: DiaryEntry = {
      id: `${selectedDate}-${Date.now()}`,
      date: selectedDate,
      text: text.trim(),
      imageDataUrl: imageDataUrl || undefined,
      createdAt: new Date().toISOString()
    };

    setEntries((current) => [...current, nextEntry]);
    setText('');
    setImageDataUrl('');
  }

  return (
    <>
      <section className="hero-card diary-hero">
        <div>
          <p className="hero-kicker">Diary Playground</p>
          <h1>온유네 다이어리</h1>
        </div>
        <div className="hero-side">
          <span className="hero-label diary-label">매일 한 줄 기록</span>
          <small>월별로 정리되고, 작성한 날짜만 예쁘게 모아 보여줍니다.</small>
        </div>
      </section>

      <section className="content-card diary-board-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Diary View</p>
            <h2>월별 다이어리 모아보기</h2>
          </div>
          <span className="subtle-note">노션형 타임라인 느낌으로 사진과 글을 가볍게 남길 수 있어요.</span>
        </div>

        <div className="diary-board">
          {groups.map((group) => (
            <section key={group.monthKey} className="diary-month-section">
              <div className="diary-month-header">
                <span className="diary-month-chip">{group.monthLabel}</span>
                <small>{group.entries.length}개의 기록</small>
              </div>

              <div className="diary-entries">
                {group.entries.map((entry) => (
                  <article key={entry.id} className="diary-entry-card">
                    <div className="diary-entry-date">
                      <strong>{format(parseISO(entry.date), 'd')}</strong>
                      <span>{format(parseISO(entry.date), 'EEE', { locale: ko })}</span>
                    </div>

                    {entry.imageDataUrl ? (
                      <div className="diary-entry-photo-frame">
                        <img src={entry.imageDataUrl} alt="다이어리 첨부 이미지" className="diary-entry-photo" />
                      </div>
                    ) : (
                      <div className="diary-entry-photo-placeholder">사진 없이 글만 남겼어요</div>
                    )}

                    <div className="diary-entry-content">
                      <p className="diary-entry-full-date">
                        {format(parseISO(entry.date), 'yyyy년 M월 d일 (EEE)', { locale: ko })}
                      </p>
                      <p className="diary-entry-text">{entry.text}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="diary-composer-shell">
        <form className={isComposerCollapsed ? 'diary-composer collapsed' : 'diary-composer'} onSubmit={handleSubmit}>
          <div className="diary-composer-topbar">
            <div className="diary-composer-header">
              <h2>오늘의 다이어리 쓰기</h2>

              {!isComposerCollapsed ? (
                <div className="diary-inline-tools">
                  <label className="diary-field compact">
                    <span>날짜</span>
                    <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
                  </label>

                  <label className="diary-field compact">
                    <span>사진 1장</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} />
                  </label>
                </div>
              ) : null}
            </div>
          </div>

          {isComposerCollapsed ? (
            <div className="diary-collapsed-bar">
              <p className="diary-date-badge compact">
                {format(parseISO(selectedDate), 'yyyy년 M월 d일 (EEE)', { locale: ko })}
              </p>
              <span className="diary-collapsed-hint">작성창을 접어두면 아래 기록들을 더 편하게 읽을 수 있어요.</span>
            </div>
          ) : (
            <>
              {imageDataUrl ? (
                <div className="diary-preview-row">
                  <div className="diary-preview-card">
                    <img src={imageDataUrl} alt="업로드 미리보기" className="diary-preview-image" />
                  </div>
                  <button
                    type="button"
                    className="page-nav-button diary-reset-button"
                    onClick={() => setImageDataUrl('')}
                  >
                    사진 지우기
                  </button>
                </div>
              ) : null}

              <label className="diary-field diary-textarea-field">
                <span>오늘 있었던 일</span>
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="예: 오늘은 바다에서 놀고 맛있는 저녁도 먹었어요."
                  rows={3}
                />
              </label>

              <div className="diary-composer-actions">
                <p className="diary-date-badge compact">
                  {format(parseISO(selectedDate), 'yyyy년 M월 d일 (EEE)', { locale: ko })}
                </p>
                <div className="diary-actions-bottom">
                  <button
                    type="button"
                    className="diary-collapse-button bottom"
                    onClick={() => setIsComposerCollapsed((current) => !current)}
                    aria-label={isComposerCollapsed ? '다이어리 작성창 펼치기' : '다이어리 작성창 접기'}
                  >
                    {isComposerCollapsed ? '△' : '▽'}
                  </button>
                  <button type="submit" className="diary-submit-button">
                    다이어리 저장하기
                  </button>
                </div>
              </div>
            </>
          )}
        </form>
      </section>
    </>
  );
}
