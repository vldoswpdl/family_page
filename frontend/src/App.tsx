import { useEffect, useState } from 'react';
import { fetchDashboard } from './lib/api';
import { getWeekDays } from './lib/calendar';
import { FilterBar } from './components/FilterBar';
import { DiaryPage } from './components/DiaryPage';
import { PersonScheduleCard } from './components/PersonScheduleCard';
import { TravelGalleryPage } from './components/TravelGalleryPage';
import { WeeklyCalendar } from './components/WeeklyCalendar';
import { DashboardResponse, PersonSlug } from './types';
import './styles.css';

type PageKey = 'dashboard' | 'diary' | 'travel';

export default function App() {
  const [selectedFilter, setSelectedFilter] = useState<PersonSlug>('all');
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<PageKey>(() => {
    if (window.location.hash === '#travel') {
      return 'travel';
    }

    if (window.location.hash === '#diary') {
      return 'diary';
    }

    return 'dashboard';
  });

  useEffect(() => {
    let disposed = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchDashboard('all');

        if (!disposed) {
          setDashboard(data);
        }
      } catch (loadError) {
        if (!disposed) {
          setError(loadError instanceof Error ? loadError.message : '알 수 없는 오류가 발생했습니다.');
        }
      } finally {
        if (!disposed) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    function syncPageFromHash() {
      if (window.location.hash === '#travel') {
        setPage('travel');
        return;
      }

      if (window.location.hash === '#diary') {
        setPage('diary');
        return;
      }

      setPage('dashboard');
    }

    window.addEventListener('hashchange', syncPageFromHash);
    return () => {
      window.removeEventListener('hashchange', syncPageFromHash);
    };
  }, []);

  function handlePageChange(nextPage: PageKey) {
    if (nextPage === 'travel') {
      window.location.hash = 'travel';
    } else if (nextPage === 'diary') {
      window.location.hash = 'diary';
    } else {
      window.location.hash = '';
    }

    setPage(nextPage);
  }

  const weekDays = dashboard ? getWeekDays(dashboard.week.start) : [];
  const schedules = dashboard?.schedules ?? [];
  // Filters only affect the main weekly board so the three person cards remain visible together.
  const filteredSchedules =
    selectedFilter === 'all'
      ? schedules
      : schedules.filter((schedule) => schedule.personSlug === selectedFilter);
  const people = dashboard?.people ?? [];

  return (
    <div className="app-shell">
      <main className="dashboard">
        <nav className="page-nav" aria-label="페이지 전환">
          <button
            type="button"
            className={page === 'dashboard' ? 'page-nav-button active' : 'page-nav-button'}
            onClick={() => handlePageChange('dashboard')}
          >
            온유네 주간일정표
          </button>
          <button
            type="button"
            className={page === 'diary' ? 'page-nav-button active' : 'page-nav-button'}
            onClick={() => handlePageChange('diary')}
          >
            온유네 다이어리
          </button>
          <button
            type="button"
            className={page === 'travel' ? 'page-nav-button active' : 'page-nav-button'}
            onClick={() => handlePageChange('travel')}
          >
            여행 페이지
          </button>
        </nav>

        {page === 'dashboard' ? (
          <>
            <section className="hero-card">
              <div>
                <p className="hero-kicker">Family Weekly Dashboard</p>
                <h1>온유네 주간일정표</h1>
              </div>
              <div className="hero-side">
                <span className="hero-label">{dashboard?.week.label ?? '주간 일정'}</span>
                <small>{dashboard?.timezone ?? 'Asia/Seoul'}</small>
              </div>
            </section>

            <section className="content-card">
              <div className="section-heading">
                <div>
                  <h2>이번 주 전체 일정표</h2>
                </div>
                {dashboard ? (
                  <FilterBar
                    people={dashboard.people}
                    selectedFilter={selectedFilter}
                    onChange={setSelectedFilter}
                  />
                ) : null}
              </div>

              {loading ? <div className="panel-state">일정을 불러오는 중입니다...</div> : null}
              {error ? <div className="panel-state error">{error}</div> : null}

              {!loading && !error && dashboard ? (
                <WeeklyCalendar days={weekDays} schedules={filteredSchedules} />
              ) : null}
            </section>

            <section className="content-card">
              <div className="section-heading">
                <div>
                  <h2>개별 주간 일정표</h2>
                </div>
                <span className="subtle-note">
                  필재는 Google Calendar, 병현·온유는 PostgreSQL 데이터를 사용합니다.
                </span>
              </div>

              <div className="person-grid">
                {people.map((person) => (
                  <PersonScheduleCard
                    key={person.slug}
                    person={person}
                    schedules={schedules.filter((schedule) => schedule.personSlug === person.slug)}
                    selectedFilter={selectedFilter}
                  />
                ))}
              </div>
            </section>
          </>
        ) : page === 'travel' ? (
          <TravelGalleryPage />
        ) : (
          <DiaryPage />
        )}
      </main>
    </div>
  );
}
