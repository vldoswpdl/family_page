import { useCallback, useEffect, useState } from 'react';
import { fetchBackendHealth, fetchDashboard } from './lib/api';
import { getWeekDays } from './lib/calendar';
import { BackendStatusBadge } from './components/BackendStatusBadge';
import { FilterBar } from './components/FilterBar';
import { DiaryPage } from './components/DiaryPage';
import { FamilyStockSheet } from './components/FamilyStockSheet';
import { PersonScheduleCard } from './components/PersonScheduleCard';
import { ScheduleComposer } from './components/ScheduleComposer';
import { TravelGalleryPage } from './components/TravelGalleryPage';
import { WeeklyCalendar } from './components/WeeklyCalendar';
import { AdminTest } from './pages/stocks/AdminTest';
import { Opinions } from './pages/stocks/Opinions';
import { Reports } from './pages/stocks/Reports';
import { StockDashboard } from './pages/stocks/StockDashboard';
import { DashboardResponse, PersonSlug } from './types';
import './styles.css';

type PageKey = 'dashboard' | 'diary' | 'travel' | 'stocks';

function pageFromHash(): PageKey {
  if (window.location.hash === '#travel') {
    return 'travel';
  }

  if (window.location.hash === '#stocks') {
    return 'stocks';
  }

  if (window.location.hash === '#diary') {
    return 'diary';
  }

  return 'dashboard';
}

export default function App() {
  const path = window.location.pathname;

  if (path === '/stocks/admin/test') {
    return <AdminTest />;
  }

  if (path === '/stocks/reports') {
    return <Reports />;
  }

  if (path === '/stocks/opinions') {
    return <Opinions />;
  }

  if (path === '/stocks') {
    return <StockDashboard />;
  }

  const [selectedFilter, setSelectedFilter] = useState<PersonSlug>('all');
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [page, setPage] = useState<PageKey>(() => pageFromHash());

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDashboard('all');
      setDashboard(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '대시보드를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    let disposed = false;

    async function checkBackend() {
      try {
        await fetchBackendHealth();
        if (!disposed) {
          setBackendStatus('online');
        }
      } catch {
        if (!disposed) {
          setBackendStatus('offline');
        }
      }
    }

    void checkBackend();
    const timer = window.setInterval(() => {
      void checkBackend();
    }, 30000);

    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    function syncPageFromHash() {
      setPage(pageFromHash());
    }

    window.addEventListener('hashchange', syncPageFromHash);
    return () => {
      window.removeEventListener('hashchange', syncPageFromHash);
    };
  }, []);

  function handlePageChange(nextPage: PageKey) {
    if (nextPage === 'travel') {
      window.location.hash = 'travel';
    } else if (nextPage === 'stocks') {
      window.location.hash = 'stocks';
    } else if (nextPage === 'diary') {
      window.location.hash = 'diary';
    } else {
      window.location.hash = '';
    }

    setPage(nextPage);
  }

  const weekDays = dashboard ? getWeekDays(dashboard.week.start) : [];
  const schedules = dashboard?.schedules ?? [];
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
            온유네 주간 일정
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
          <button
            type="button"
            className={page === 'stocks' ? 'page-nav-button active' : 'page-nav-button'}
            onClick={() => handlePageChange('stocks')}
          >
            국내 주식 포트폴리오
          </button>
        </nav>

        {page === 'dashboard' ? (
          <>
            <section className="hero-card">
              <div>
                <p className="hero-kicker">Family Weekly Dashboard</p>
                <h1>온유네 주간 일정</h1>
              </div>
              <div className="hero-side">
                <BackendStatusBadge status={backendStatus} />
                <span className="hero-label">{dashboard?.week.label ?? '주간 일정'}</span>
                <small>{dashboard?.timezone ?? 'Asia/Seoul'}</small>
              </div>
            </section>

            <section className="content-card">
              <div className="section-heading">
                <div>
                  <h2>이번 주 전체 일정</h2>
                </div>
                <BackendStatusBadge status={backendStatus} />
                {dashboard ? (
                  <FilterBar
                    people={dashboard.people}
                    selectedFilter={selectedFilter}
                    onChange={setSelectedFilter}
                  />
                ) : null}
              </div>

              {dashboard ? <ScheduleComposer people={dashboard.people} onCreated={loadDashboard} /> : null}

              {loading ? <div className="panel-state">일정을 불러오는 중입니다...</div> : null}
              {error ? <div className="panel-state error">{error}</div> : null}

              {!loading && !error && dashboard ? (
                <WeeklyCalendar days={weekDays} schedules={filteredSchedules} />
              ) : null}
            </section>

            <section className="content-card">
              <div className="section-heading">
                <div>
                  <h2>개별 주간 일정</h2>
                </div>
                <span className="subtle-note">
                  필재 일정은 Google Calendar, 병현/온유 일정은 PostgreSQL 데이터를 함께 보여줍니다.
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
        ) : page === 'stocks' ? (
          <FamilyStockSheet />
        ) : (
          <DiaryPage />
        )}
      </main>
    </div>
  );
}
