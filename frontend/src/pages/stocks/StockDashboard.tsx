import { useEffect, useState } from 'react';
import { AllocationChart, ReturnChart } from '../../components/stocks/StockCharts';
import { DailyOpinionBoard } from '../../components/stocks/DailyOpinionBoard';
import { HoldingCards } from '../../components/stocks/HoldingCards';
import { HoldingsTable } from '../../components/stocks/HoldingsTable';
import { InsightCard } from '../../components/stocks/InsightCard';
import { ModeBadge } from '../../components/stocks/ModeBadge';
import { PortfolioSummary } from '../../components/stocks/PortfolioSummary';
import { StatusBanner } from '../../components/stocks/StatusBanner';
import { StockDetailPanel } from '../../components/stocks/StockDetailPanel';
import {
  fetchDailyInsight,
  fetchKiwoomStatus,
  fetchOpinions,
  fetchPortfolioHistory,
  fetchReports,
  fetchStockPortfolio,
  refreshStockPortfolio
} from '../../lib/stockApi';
import { DailyReport, KiwoomStatus, PortfolioHistoryPoint, StockInsight, StockMode, StockPortfolio, TradeOpinion } from '../../types/stocks';

export function StockDashboard() {
  const [mode, setMode] = useState<StockMode>('real');
  const [ownerName, setOwnerName] = useState('Family');
  const [portfolio, setPortfolio] = useState<StockPortfolio | null>(null);
  const [history, setHistory] = useState<PortfolioHistoryPoint[]>([]);
  const [stockHistory, setStockHistory] = useState<PortfolioHistoryPoint[]>([]);
  const [status, setStatus] = useState<KiwoomStatus | null>(null);
  const [insight, setInsight] = useState<StockInsight | null>(null);
  const [opinions, setOpinions] = useState<TradeOpinion[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [selectedStockCode, setSelectedStockCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [portfolioData, historyData, statusData, insightData, opinionData, reportData] = await Promise.all([
        fetchStockPortfolio(mode, ownerName),
        fetchPortfolioHistory(mode, ownerName),
        fetchKiwoomStatus(mode),
        fetchDailyInsight(mode),
        fetchOpinions({ ownerName }),
        fetchReports(mode)
      ]);

      setPortfolio(portfolioData);
      setHistory(historyData);
      setStatus(statusData);
      setInsight(insightData);
      setOpinions(opinionData);
      setReports(reportData);
      setSelectedStockCode((current) => {
        if (current && portfolioData.holdings.some((holding) => holding.stockCode === current)) {
          return current;
        }

        return portfolioData.holdings[0]?.stockCode ?? null;
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load stock dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [mode, ownerName]);

  useEffect(() => {
    let disposed = false;

    async function loadStockHistory() {
      if (!selectedStockCode) {
        setStockHistory([]);
        return;
      }

      try {
        const data = await fetchPortfolioHistory(mode, ownerName, selectedStockCode);
        if (!disposed) {
          setStockHistory(data);
        }
      } catch {
        if (!disposed) {
          setStockHistory([]);
        }
      }
    }

    void loadStockHistory();

    return () => {
      disposed = true;
    };
  }, [mode, ownerName, selectedStockCode]);

  async function handleRefresh() {
    if (mode === 'real' && !window.confirm('Run a real Kiwoom server portfolio refresh?')) {
      return;
    }

    setRefreshing(true);
    setError(null);
    try {
      await refreshStockPortfolio(mode, ownerName);
      await load();
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Refresh failed.');
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <main className="stock-shell">
      <header className="stock-topbar">
        <div>
          <p>Family Stock Dashboard</p>
          <h1>국내주식 포트폴리오</h1>
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
          <button className={mode === 'mock' ? 'active' : ''} onClick={() => setMode('mock')} type="button">
            Mock
          </button>
          <button className={mode === 'real' ? 'active real' : 'real'} onClick={() => setMode('real')} type="button">
            Real
          </button>
          <ModeBadge mode={mode} />
        </div>
        <label className="stock-input">
          Owner
          <select value={ownerName} onChange={(event) => setOwnerName(event.target.value)}>
            <option value="Family">All</option>
            <option value="Me">Me</option>
            <option value="Child">Child</option>
          </select>
        </label>
        <button className="stock-primary-button" onClick={handleRefresh} disabled={refreshing} type="button">
          {refreshing ? 'Refreshing...' : '실시간 새로고침'}
        </button>
      </section>

      <StatusBanner portfolio={portfolio} status={status} error={error} />

      {loading || !portfolio ? (
        <div className="stock-panel stock-empty large">Loading stock dashboard...</div>
      ) : (
        <>
          <section className="stock-meta-panel">
            <div>
              <span>Last updated</span>
              <strong>{new Date(portfolio.fetchedAt).toLocaleString()}</strong>
            </div>
            <div>
              <span>Current IP</span>
              <strong>{status?.currentIp || 'Unknown'}</strong>
            </div>
            <div>
              <span>Registered IP</span>
              <strong>{status?.registeredIp || 'Not configured'}</strong>
            </div>
            <div>
              <span>API status</span>
              <strong>{status?.apiStatus || 'Unknown'}</strong>
            </div>
          </section>

          <PortfolioSummary portfolio={portfolio} />

          <section className="stock-panel">
            <div className="stock-section-title">
              <div>
                <span>Holdings Snapshot</span>
                <h2>보유 종목 한눈에 보기</h2>
              </div>
              <small>{portfolio.holdings.length} stocks</small>
            </div>
            <HoldingCards
              holdings={portfolio.holdings}
              selectedStockCode={selectedStockCode}
              onSelect={setSelectedStockCode}
            />
          </section>

          <section className="stock-grid two">
            <ReturnChart history={history} />
            <AllocationChart holdings={portfolio.holdings} />
          </section>

          <StockDetailPanel
            holding={portfolio.holdings.find((holding) => holding.stockCode === selectedStockCode) ?? null}
            history={stockHistory}
            totalAsset={portfolio.totalAsset}
          />

          <DailyOpinionBoard holdings={portfolio.holdings} totalAsset={portfolio.totalAsset} />

          <section className="stock-panel">
            <div className="stock-section-title">
              <div>
                <span>Holdings</span>
                <h2>Current portfolio</h2>
              </div>
              <small>{portfolio.accountAlias}</small>
            </div>
            <HoldingsTable holdings={portfolio.holdings} />
          </section>

          <InsightCard insight={insight} opinions={opinions} />

          <section className="stock-panel">
            <div className="stock-section-title">
              <div>
                <span>Recent Reports</span>
                <h2>Daily report history</h2>
              </div>
              <a href="/stocks/reports">Open reports</a>
            </div>
            <div className="stock-report-mini-list">
              {reports.slice(0, 3).map((report) => (
                <article key={report.id}>
                  <strong>{new Date(report.reportDate).toLocaleDateString()}</strong>
                  <p>{report.summary}</p>
                  <span>{report.sentToTelegram ? 'Telegram sent' : 'Not sent'}</span>
                </article>
              ))}
              {!reports.length ? <div className="stock-empty compact">No reports yet.</div> : null}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
