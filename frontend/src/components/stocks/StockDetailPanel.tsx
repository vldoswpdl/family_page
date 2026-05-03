import { StockMonthlyChart } from './StockCharts';
import { PortfolioHistoryPoint, StockHolding } from '../../types/stocks';

function money(value: number) {
  return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

function getAction(holding: StockHolding) {
  if (holding.profitRate >= 20) {
    return 'SELL CHECK';
  }

  if (holding.profitRate <= -10) {
    return 'WATCH';
  }

  return 'HOLD';
}

interface StockDetailPanelProps {
  holding: StockHolding | null;
  history: PortfolioHistoryPoint[];
  totalAsset: number;
}

export function StockDetailPanel({ holding, history, totalAsset }: StockDetailPanelProps) {
  if (!holding) {
    return (
      <section className="stock-panel stock-empty large">
        종목을 선택하면 월별 차트와 수익률 현황이 표시됩니다.
      </section>
    );
  }

  const allocation = totalAsset > 0 ? (holding.evaluationAmount / totalAsset) * 100 : 0;
  const action = getAction(holding);

  return (
    <section className="stock-panel">
      <div className="stock-section-title">
        <div>
          <span>Stock Detail</span>
          <h2>
            {holding.stockName} <small>{holding.stockCode}</small>
          </h2>
        </div>
        <strong className={`stock-action-chip ${action.toLowerCase().replace(' ', '-')}`}>{action}</strong>
      </div>

      <div className="stock-detail-grid">
        <article>
          <span>Evaluation</span>
          <strong>{money(holding.evaluationAmount)}</strong>
        </article>
        <article>
          <span>Profit / Loss</span>
          <strong className={holding.profitLoss >= 0 ? 'positive' : 'negative'}>{money(holding.profitLoss)}</strong>
        </article>
        <article>
          <span>Return Rate</span>
          <strong className={holding.profitRate >= 0 ? 'positive' : 'negative'}>{holding.profitRate.toFixed(2)}%</strong>
        </article>
        <article>
          <span>Allocation</span>
          <strong>{allocation.toFixed(1)}%</strong>
        </article>
        <article>
          <span>Quantity</span>
          <strong>{holding.quantity.toLocaleString('ko-KR')}</strong>
        </article>
        <article>
          <span>Average Price</span>
          <strong>{money(holding.averagePrice)}</strong>
        </article>
        <article>
          <span>Current Price</span>
          <strong>{money(holding.currentPrice)}</strong>
        </article>
        <article>
          <span>History Points</span>
          <strong>{history.length.toLocaleString('ko-KR')}</strong>
        </article>
      </div>

      <StockMonthlyChart
        history={history}
        currentEvaluationAmount={holding.evaluationAmount}
        currentProfitRate={holding.profitRate}
      />
    </section>
  );
}

