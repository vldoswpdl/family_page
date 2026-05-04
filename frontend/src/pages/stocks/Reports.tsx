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
      setMessage('Daily report generated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Report generation failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleTelegram() {
    if (!window.confirm('Send the latest REAL mode daily report to Telegram?')) {
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      await sendTelegramReport(STOCK_MODE);
      await loadReports();
      setMessage('Telegram summary sent.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Telegram send failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="stock-shell">
      <header className="stock-topbar">
        <div>
          <p>Reports</p>
          <h1>Daily summaries</h1>
        </div>
        <nav className="stock-nav">
          <a href="/stocks">Dashboard</a>
          <a href="/stocks/admin/test">API Test</a>
          <a href="/stocks/reports">Reports</a>
          <a href="/stocks/opinions">Opinions</a>
        </nav>
      </header>

      <section className="stock-toolbar">
        <div className="stock-control-group">
          <ModeBadge mode={STOCK_MODE} />
          <strong className="stock-real-warning">REAL SERVER REPORTS</strong>
        </div>
        <button className="stock-primary-button" disabled={loading} onClick={handleGenerate} type="button">
          Generate today
        </button>
        <button className="stock-secondary-button" disabled={loading} onClick={handleTelegram} type="button">
          Send Telegram
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
              <small>{report.sentToTelegram ? 'Telegram sent' : 'Not sent'}</small>
            </div>
            <p>{report.portfolioSummary}</p>
            <pre className="stock-report-text">{report.insightText}</pre>
            {report.riskPoints ? <p className="negative">{report.riskPoints}</p> : null}
          </article>
        ))}
        {!reports.length ? <div className="stock-panel stock-empty large">No reports yet.</div> : null}
      </section>
    </main>
  );
}
