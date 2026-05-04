import { StockMonthlyChart } from './StockCharts';
import { PortfolioHistoryPoint, StockHolding } from '../../types/stocks';

function money(value: number) {
  return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

function getAction(holding: StockHolding) {
  if (holding.profitRate >= 20) {
    return '매도 검토';
  }

  if (holding.profitRate <= -10) {
    return '관망';
  }

  return '보유';
}

function actionClass(action: string) {
  if (action === '매도 검토') return 'sell-check';
  if (action === '관망') return 'watch';
  return 'hold';
}

interface StockDetailPanelProps {
  holding: StockHolding | null;
  history: PortfolioHistoryPoint[];
  totalAsset: number;
}

export function StockDetailPanel({ holding, history, totalAsset }: StockDetailPanelProps) {
  if (!holding) {
    return <section className="stock-panel stock-empty large">종목을 선택하면 월별 차트와 수익률 현황을 표시합니다.</section>;
  }

  const allocation = totalAsset > 0 ? (holding.evaluationAmount / totalAsset) * 100 : 0;
  const action = getAction(holding);

  return (
    <section className="stock-panel">
      <div className="stock-section-title">
        <div>
          <span>종목 상세</span>
          <h2>
            {holding.stockName} <small>{holding.stockCode}</small>
          </h2>
        </div>
        <strong className={`stock-action-chip ${actionClass(action)}`}>{action}</strong>
      </div>

      <div className="stock-detail-grid">
        <article>
          <span>평가금액</span>
          <strong>{money(holding.evaluationAmount)}</strong>
        </article>
        <article>
          <span>평가손익</span>
          <strong className={holding.profitLoss >= 0 ? 'positive' : 'negative'}>{money(holding.profitLoss)}</strong>
        </article>
        <article>
          <span>수익률</span>
          <strong className={holding.profitRate >= 0 ? 'positive' : 'negative'}>{holding.profitRate.toFixed(2)}%</strong>
        </article>
        <article>
          <span>비중</span>
          <strong>{allocation.toFixed(1)}%</strong>
        </article>
        <article>
          <span>수량</span>
          <strong>{holding.quantity.toLocaleString('ko-KR')}</strong>
        </article>
        <article>
          <span>평균단가</span>
          <strong>{money(holding.averagePrice)}</strong>
        </article>
        <article>
          <span>현재가</span>
          <strong>{money(holding.currentPrice)}</strong>
        </article>
        <article>
          <span>기록 수</span>
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
