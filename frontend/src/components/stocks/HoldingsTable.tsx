import { StockHolding } from '../../types/stocks';

function money(value: number) {
  return Math.round(value).toLocaleString('ko-KR');
}

interface HoldingsTableProps {
  holdings: StockHolding[];
}

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  if (!holdings.length) {
    return <div className="stock-empty">저장된 보유 종목이 없습니다.</div>;
  }

  return (
    <div className="stock-table-wrap">
      <table className="stock-table">
        <thead>
          <tr>
            <th>종목</th>
            <th>수량</th>
            <th>평균단가</th>
            <th>현재가</th>
            <th>평가금액</th>
            <th>평가손익</th>
            <th>수익률</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding) => (
            <tr key={`${holding.stockCode}-${holding.stockName}`}>
              <td>
                <strong>{holding.stockName}</strong>
                <span>{holding.stockCode}</span>
              </td>
              <td>{money(holding.quantity)}</td>
              <td>{money(holding.averagePrice)}</td>
              <td>{money(holding.currentPrice)}</td>
              <td>{money(holding.evaluationAmount)}</td>
              <td className={holding.profitLoss >= 0 ? 'positive' : 'negative'}>{money(holding.profitLoss)}</td>
              <td className={holding.profitRate >= 0 ? 'positive' : 'negative'}>{holding.profitRate.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
