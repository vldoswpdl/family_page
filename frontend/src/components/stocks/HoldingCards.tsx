import { StockHolding } from '../../types/stocks';

function money(value: number) {
  return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

interface HoldingCardsProps {
  holdings: StockHolding[];
  selectedStockCode: string | null;
  onSelect: (stockCode: string) => void;
}

export function HoldingCards({ holdings, selectedStockCode, onSelect }: HoldingCardsProps) {
  if (!holdings.length) {
    return <div className="stock-empty large">표시할 보유 종목이 없습니다. Real 모드에서 Refresh를 실행하세요.</div>;
  }

  return (
    <div className="stock-holding-card-grid">
      {holdings.map((holding) => (
        <button
          key={holding.stockCode}
          type="button"
          className={selectedStockCode === holding.stockCode ? 'stock-holding-card active' : 'stock-holding-card'}
          onClick={() => onSelect(holding.stockCode)}
        >
          <span>{holding.stockCode}</span>
          <strong>{holding.stockName}</strong>
          <small>{money(holding.evaluationAmount)}</small>
          <em className={holding.profitRate >= 0 ? 'positive' : 'negative'}>{holding.profitRate.toFixed(2)}%</em>
        </button>
      ))}
    </div>
  );
}

