import { StockHolding } from '../../types/stocks';

function money(value: number) {
  return Math.round(value).toLocaleString('ko-KR');
}

interface HoldingsTableProps {
  holdings: StockHolding[];
}

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  if (!holdings.length) {
    return <div className="stock-empty">No holdings saved yet.</div>;
  }

  return (
    <div className="stock-table-wrap">
      <table className="stock-table">
        <thead>
          <tr>
            <th>Stock</th>
            <th>Qty</th>
            <th>Avg</th>
            <th>Price</th>
            <th>Evaluation</th>
            <th>P/L</th>
            <th>Return</th>
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

