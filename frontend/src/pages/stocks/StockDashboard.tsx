import { useEffect, useState } from 'react';
import { AllocationChart, ReturnChart } from '../../components/stocks/StockCharts';
import { DailyOpinionBoard } from '../../components/stocks/DailyOpinionBoard';
import { FixedIpManager } from '../../components/stocks/FixedIpManager';
import { HoldingCards } from '../../components/stocks/HoldingCards';
import { HoldingsTable } from '../../components/stocks/HoldingsTable';
import { InsightCard } from '../../components/stocks/InsightCard';
import { InvestorInsightPanel } from '../../components/stocks/InvestorInsightPanel';
import { PerformanceSummary } from '../../components/stocks/PerformanceSummary';
import { PortfolioSummary } from '../../components/stocks/PortfolioSummary';
import { StatusBanner } from '../../components/stocks/StatusBanner';
import { StockDetailPanel } from '../../components/stocks/StockDetailPanel';
import {
  fetchDailyInsight,
  fetchKiwoomStatus,
  fetchOpinions,
  fetchPortfolioHistory,
  fetchRegisteredIps,
  fetchReports,
  fetchStockPortfolio,
  refreshStockPortfolio
} from '../../lib/stockApi';
import {
  DailyReport,
  KiwoomStatus,
  PortfolioHistoryPoint,
  RegisteredIp,
  StockInsight,
  StockMode,
  StockPortfolio,
  TradeOpinion
} from '../../types/stocks';

const STOCK_MODE: StockMode = 'real';

export function StockDashboard() {
  const mode = STOCK_MODE;
  const [ownerName, setOwnerName] = useState('Family');
  const [portfolio, setPortfolio] = useState<StockPortfolio | null>(null);
  const [history, setHistory] = useState<PortfolioHistoryPoint[]>([]);
  const [stockHistory, setStockHistory] = useState<PortfolioHistoryPoint[]>([]);
  const [status, setStatus] = useState<KiwoomStatus | null>(null);
  const [registeredIps, setRegisteredIps] = useState<RegisteredIp[]>([]);
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
      setRegisteredIps(statusData.registeredIps ?? []);
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
      setError(loadError instanceof Error ? loadError.message : '주식 대시보드를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [ownerName]);

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
  }, [ownerName, selectedStockCode]);

  async function reloadIpStatus() {
    const [statusData, ips] = await Promise.all([fetchKiwoomStatus(mode), fetchRegisteredIps(mode)]);
    setStatus(statusData);
    setRegisteredIps(ips);
  }

  async function handleRefresh() {
    setRefreshing(true);
    setError(null);

    try {
      await refreshStockPortfolio(mode, ownerName);
      await load();
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : '새로고침에 실패했습니다.');
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <main className="stock-shell">
      <header className="stock-topbar">
        <div>
          <p>가족 주식 대시보드</p>
          <h1>국내 주식 포트폴리오</h1>
        </div>
        <nav className="stock-nav">
          <a href="/stocks">대시보드</a>
          <a href="/stocks/admin/test">API 테스트</a>
          <a href="/stocks/reports">리포트</a>
          <a href="/stocks/opinions">투자 의견</a>
        </nav>
      </header>

      <section className="stock-toolbar">
        <strong className="stock-mode-badge real">실전 서버</strong>
        <label className="stock-input">
          소유자
          <select value={ownerName} onChange={(event) => setOwnerName(event.target.value)}>
            <option value="Family">전체</option>
            <option value="Me">나</option>
            <option value="Child">자녀</option>
          </select>
        </label>
        <button className="stock-primary-button" onClick={handleRefresh} disabled={refreshing} type="button">
          {refreshing ? '새로고침 중...' : '실시간 포트폴리오 새로고침'}
        </button>
      </section>

      <StatusBanner portfolio={portfolio} status={status} error={error} />

      {loading || !portfolio ? (
        <div className="stock-panel stock-empty large">주식 대시보드를 불러오는 중입니다...</div>
      ) : (
        <>
          <section className="stock-meta-panel">
            <div>
              <span>최근 조회 시각</span>
              <strong>{new Date(portfolio.fetchedAt).toLocaleString()}</strong>
            </div>
            <div>
              <span>현재 외부 IP</span>
              <strong>{status?.currentIp || '확인 불가'}</strong>
            </div>
            <div>
              <span>고정 IP 목록</span>
              <strong>{registeredIps.map((item) => item.ip).join(', ') || '설정 없음'}</strong>
            </div>
            <div>
              <span>API 상태</span>
              <strong>{status?.apiStatus || '확인 불가'}</strong>
            </div>
          </section>

          <PortfolioSummary portfolio={portfolio} />

          <FixedIpManager
            mode={mode}
            currentIp={status?.currentIp ?? null}
            registeredIps={registeredIps}
            onChanged={reloadIpStatus}
          />

          <section className="stock-panel">
            <div className="stock-section-title">
              <div>
                <span>보유 현황 스냅샷</span>
                <h2>포트폴리오 보유 종목</h2>
              </div>
              <small>{portfolio.holdings.length}개 종목</small>
            </div>
            <HoldingCards holdings={portfolio.holdings} selectedStockCode={selectedStockCode} onSelect={setSelectedStockCode} />
          </section>

          <section className="stock-grid two">
            <ReturnChart history={history} />
            <AllocationChart holdings={portfolio.holdings} />
          </section>

          <PerformanceSummary portfolio={portfolio} history={history} />

          <InvestorInsightPanel portfolio={portfolio} />

          <StockDetailPanel
            holding={portfolio.holdings.find((holding) => holding.stockCode === selectedStockCode) ?? null}
            history={stockHistory}
            totalAsset={portfolio.totalAsset}
          />

          <DailyOpinionBoard holdings={portfolio.holdings} totalAsset={portfolio.totalAsset} />

          <section className="stock-panel">
            <div className="stock-section-title">
              <div>
                <span>보유 종목</span>
                <h2>현재 포트폴리오</h2>
              </div>
              <small>{portfolio.accountAlias}</small>
            </div>
            <HoldingsTable holdings={portfolio.holdings} />
          </section>

          <InsightCard insight={insight} opinions={opinions} />

          <section className="stock-panel">
            <div className="stock-section-title">
              <div>
                <span>최근 리포트</span>
                <h2>일일 리포트 기록</h2>
              </div>
              <a href="/stocks/reports">리포트 열기</a>
            </div>
            <div className="stock-report-mini-list">
              {reports.slice(0, 3).map((report) => (
                <article key={report.id}>
                  <strong>{new Date(report.reportDate).toLocaleDateString()}</strong>
                  <p>{report.summary}</p>
                  <span>{report.sentToTelegram ? '텔레그램 전송 완료' : '미전송'}</span>
                </article>
              ))}
              {!reports.length ? <div className="stock-empty compact">아직 리포트가 없습니다.</div> : null}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
