import { PortfolioHistoryPoint, StockPortfolio } from '../../types/stocks';

function money(value: number) {
  return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

function latestByPeriod(history: PortfolioHistoryPoint[], periodLength: number) {
  const map = new Map<string, PortfolioHistoryPoint>();
  for (const point of history) {
    map.set(point.date.slice(0, periodLength), point);
  }

  return Array.from(map.entries())
    .sort(([left], [right]) => right.localeCompare(left))
    .slice(0, periodLength === 4 ? 5 : 12)
    .map(([period, point]) => ({ period, point }));
}

interface PerformanceSummaryProps {
  portfolio: StockPortfolio;
  history: PortfolioHistoryPoint[];
}

export function PerformanceSummary({ portfolio, history }: PerformanceSummaryProps) {
  const currentPoint = {
    date: portfolio.fetchedAt.slice(0, 10),
    profitRate: portfolio.profitRate,
    profitLoss: portfolio.profitLoss,
    totalAsset: portfolio.totalAsset
  };
  const source = history.length ? history : [currentPoint];
  const yearly = latestByPeriod(source, 4);
  const monthly = latestByPeriod(source, 7);

  return (
    <section className="stock-panel">
      <div className="stock-section-title">
        <div>
          <span>성과 기록</span>
          <h2>연도별 / 월별 수익 현황</h2>
        </div>
        <small>기간별 최신 스냅샷 기준</small>
      </div>

      <div className="stock-performance-grid">
        <article>
          <h3>연도별</h3>
          {yearly.map(({ period, point }) => (
            <div key={period}>
              <span>{period}</span>
              <strong className={point.profitRate >= 0 ? 'positive' : 'negative'}>{point.profitRate.toFixed(2)}%</strong>
              <em>{money(point.profitLoss)}</em>
            </div>
          ))}
        </article>
        <article>
          <h3>월별</h3>
          {monthly.map(({ period, point }) => (
            <div key={period}>
              <span>{period}</span>
              <strong className={point.profitRate >= 0 ? 'positive' : 'negative'}>{point.profitRate.toFixed(2)}%</strong>
              <em>{money(point.profitLoss)}</em>
            </div>
          ))}
        </article>
      </div>
    </section>
  );
}
