import { useEffect, useState } from 'react';
import { AllocationChart, ReturnChart } from './stocks/StockCharts';
import { DailyOpinionBoard } from './stocks/DailyOpinionBoard';
import { HoldingsTable } from './stocks/HoldingsTable';
import { InsightCard } from './stocks/InsightCard';
import { InvestorInsightPanel } from './stocks/InvestorInsightPanel';
import { PerformanceSummary } from './stocks/PerformanceSummary';
import { PortfolioSummary } from './stocks/PortfolioSummary';
import { StatusBanner } from './stocks/StatusBanner';
import {
  fetchDailyInsight,
  fetchKiwoomStatus,
  fetchOpinions,
  fetchPortfolioHistory,
  fetchReports,
  fetchStockPortfolio,
  refreshStockPortfolio
} from '../lib/stockApi';
import {
  DailyReport,
  KiwoomStatus,
  PortfolioHistoryPoint,
  StockInsight,
  StockMode,
  StockPortfolio,
  TradeOpinion
} from '../types/stocks';

const STOCK_MODE: StockMode = 'real';

export function FamilyStockSheet() {
  const [portfolio, setPortfolio] = useState<StockPortfolio | null>(null);
  const [history, setHistory] = useState<PortfolioHistoryPoint[]>([]);
  const [status, setStatus] = useState<KiwoomStatus | null>(null);
  const [insight, setInsight] = useState<StockInsight | null>(null);
  const [opinions, setOpinions] = useState<TradeOpinion[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const [portfolioData, historyData, statusData, insightData, opinionData, reportData] = await Promise.all([
        fetchStockPortfolio(STOCK_MODE, 'Family'),
        fetchPortfolioHistory(STOCK_MODE, 'Family'),
        fetchKiwoomStatus(STOCK_MODE),
        fetchDailyInsight(STOCK_MODE),
        fetchOpinions({ ownerName: 'Family' }),
        fetchReports(STOCK_MODE)
      ]);

      setPortfolio(portfolioData);
      setHistory(historyData);
      setStatus(statusData);
      setInsight(insightData);
      setOpinions(opinionData);
      setReports(reportData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '국내 주식 포트폴리오를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    setError(null);

    try {
      await refreshStockPortfolio(STOCK_MODE, 'Family');
      await load();
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : '포트폴리오 새로고침에 실패했습니다.');
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="family-stock-sheet">
      <section className="hero-card stock-family-hero">
        <div>
          <p className="hero-kicker">Family Stock Sheet</p>
          <h1>국내 주식 포트폴리오</h1>
        </div>
        <div className="hero-side">
          <span className="hero-label">실전 서버</span>
          <small>{status?.apiStatus ?? '상태 확인 중'}</small>
        </div>
      </section>

      <section className="content-card">
        <div className="section-heading">
          <div>
            <h2>가족 계좌 요약</h2>
            <p className="subtle-note">키움 실전 서버에서 가져온 최신 저장 데이터를 기준으로 표시합니다.</p>
          </div>
          <div className="stock-family-actions">
            <a className="stock-secondary-button" href="/stocks">
              상세 페이지
            </a>
            <button className="stock-primary-button" type="button" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? '새로고침 중...' : '실시간 새로고침'}
            </button>
          </div>
        </div>

        <StatusBanner portfolio={portfolio} status={status} error={error} />

        {loading || !portfolio ? (
          <div className="panel-state">국내 주식 포트폴리오를 불러오는 중입니다...</div>
        ) : (
          <div className="stock-family-stack">
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
                <span>등록 IP</span>
                <strong>{status?.registeredIps?.map((item) => item.ip).join(', ') || '설정 없음'}</strong>
              </div>
              <div>
                <span>토큰 상태</span>
                <strong>{status?.tokenStatus.exists ? (status.tokenStatus.isExpired ? '만료' : '정상') : '없음'}</strong>
              </div>
            </section>

            <PortfolioSummary portfolio={portfolio} />

            <section className="stock-grid two">
              <ReturnChart history={history} />
              <AllocationChart holdings={portfolio.holdings} />
            </section>

            <PerformanceSummary portfolio={portfolio} history={history} />
            <InvestorInsightPanel portfolio={portfolio} />
            <DailyOpinionBoard holdings={portfolio.holdings} totalAsset={portfolio.totalAsset} />

            <section className="stock-panel">
              <div className="stock-section-title">
                <div>
                  <span>보유 종목</span>
                  <h2>현재 보유 현황</h2>
                </div>
                <small>{portfolio.holdings.length}개 종목</small>
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
                <a href="/stocks/reports">전체 보기</a>
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
          </div>
        )}
      </section>
    </div>
  );
}
