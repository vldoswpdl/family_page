import { useEffect, useState } from 'react';
import { ModeBadge } from '../../components/stocks/ModeBadge';
import { createDailyReport, fetchReports, sendTelegramReport } from '../../lib/stockApi';
import { DailyReport, StockMode } from '../../types/stocks';

const STOCK_MODE: StockMode = 'real';

export function Reports() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadReports() {
    const data = await fetchReports(STOCK_MODE);
    setReports(data);
  }

  useEffect(() => {
    void loadReports();
  }, []);

  async function handleGenerate() {
    setLoading(true);
    setMessage(null);
    try {
      await createDailyReport(STOCK_MODE);
      await loadReports();
      setMessage('오늘 리포트를 생성했습니다.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '리포트 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleTelegram() {
    if (!window.confirm('최신 실전 서버 리포트를 텔레그램으로 전송할까요?')) {
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      await sendTelegramReport(STOCK_MODE);
      await loadReports();
      setMessage('텔레그램 요약을 전송했습니다.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '텔레그램 전송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="stock-shell">
      <header className="stock-topbar">
        <div>
          <p>리포트</p>
          <h1>일일 요약</h1>
        </div>
        <nav className="stock-nav">
          <a href="/stocks">대시보드</a>
          <a href="/stocks/admin/test">API 테스트</a>
          <a href="/stocks/reports">리포트</a>
          <a href="/stocks/opinions">투자 의견</a>
        </nav>
      </header>

      <section className="stock-toolbar">
        <div className="stock-control-group">
          <ModeBadge mode={STOCK_MODE} />
          <strong className="stock-real-warning">실전 서버 리포트</strong>
        </div>
        <button className="stock-primary-button" disabled={loading} onClick={handleGenerate} type="button">
          오늘 리포트 생성
        </button>
        <button className="stock-secondary-button" disabled={loading} onClick={handleTelegram} type="button">
          텔레그램 전송
        </button>
      </section>

      {message ? <div className="stock-status-banner warning">{message}</div> : null}

      <section className="stock-report-list">
        {reports.map((report) => (
          <article className="stock-panel" key={report.id}>
            <div className="stock-section-title">
              <div>
                <span>{new Date(report.reportDate).toLocaleDateString()}</span>
                <h2>{report.summary}</h2>
              </div>
              <small>{report.sentToTelegram ? '텔레그램 전송 완료' : '미전송'}</small>
            </div>
            <p>{report.portfolioSummary}</p>
            <pre className="stock-report-text">{report.insightText}</pre>
            {report.riskPoints ? <p className="negative">{report.riskPoints}</p> : null}
          </article>
        ))}
        {!reports.length ? <div className="stock-panel stock-empty large">아직 리포트가 없습니다.</div> : null}
      </section>
    </main>
  );
}
