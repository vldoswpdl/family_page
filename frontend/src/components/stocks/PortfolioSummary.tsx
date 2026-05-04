import { StockPortfolio } from '../../types/stocks';

function money(value: number) {
  return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

function rate(value: number) {
  return `${value.toFixed(2)}%`;
}

interface PortfolioSummaryProps {
  portfolio: StockPortfolio;
}

export function PortfolioSummary({ portfolio }: PortfolioSummaryProps) {
  const cards = [
    { label: '총자산', value: money(portfolio.totalAsset) },
    { label: '평가손익', value: money(portfolio.profitLoss), tone: portfolio.profitLoss >= 0 ? 'positive' : 'negative' },
    { label: '수익률', value: rate(portfolio.profitRate), tone: portfolio.profitRate >= 0 ? 'positive' : 'negative' },
    { label: '보유 종목', value: `${portfolio.holdings.length}개` }
  ];

  return (
    <div className="stock-summary-grid">
      {cards.map((card) => (
        <article className="stock-summary-card" key={card.label}>
          <span>{card.label}</span>
          <strong className={card.tone}>{card.value}</strong>
        </article>
      ))}
    </div>
  );
}
