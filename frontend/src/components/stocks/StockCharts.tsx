import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { PortfolioHistoryPoint, StockHolding } from '../../types/stocks';

const COLORS = ['#2563eb', '#16a34a', '#f97316', '#9333ea', '#0f766e', '#dc2626', '#64748b'];

interface ReturnChartProps {
  history: PortfolioHistoryPoint[];
}

export function ReturnChart({ history }: ReturnChartProps) {
  const data = history.length ? history : [{ date: 'No data', profitRate: 0, profitLoss: 0 }];

  return (
    <div className="stock-chart">
      <h3>Return Rate</h3>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Area type="monotone" dataKey="profitRate" stroke="#2563eb" fill="#bfdbfe" name="Return %" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface AllocationChartProps {
  holdings: StockHolding[];
}

export function AllocationChart({ holdings }: AllocationChartProps) {
  const data = holdings.map((holding) => ({
    name: holding.stockName,
    value: Math.max(holding.evaluationAmount, 0)
  }));

  return (
    <div className="stock-chart">
      <h3>Allocation</h3>
      <ResponsiveContainer width="100%" height={260}>
        {data.length ? (
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={54} outerRadius={92} paddingAngle={3}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        ) : (
          <BarChart data={[{ name: 'No data', value: 0 }]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" />
            <YAxis />
            <Bar dataKey="value" fill="#cbd5e1" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

interface StockMonthlyChartProps {
  history: PortfolioHistoryPoint[];
  currentEvaluationAmount: number;
  currentProfitRate: number;
}

function monthLabel(date: string) {
  return date.length >= 7 ? date.slice(0, 7) : date;
}

export function StockMonthlyChart({ history, currentEvaluationAmount, currentProfitRate }: StockMonthlyChartProps) {
  const monthlyMap = new Map<string, PortfolioHistoryPoint>();

  for (const point of history) {
    monthlyMap.set(monthLabel(point.date), point);
  }

  const monthlyData = Array.from(monthlyMap.entries()).map(([month, point]) => ({
    month,
    profitRate: point.profitRate,
    evaluationAmount: point.evaluationAmount ?? currentEvaluationAmount,
    profitLoss: point.profitLoss
  }));

  const data = monthlyData.length
    ? monthlyData
    : [
        {
          month: new Date().toISOString().slice(0, 7),
          profitRate: currentProfitRate,
          evaluationAmount: currentEvaluationAmount,
          profitLoss: 0
        }
      ];

  return (
    <div className="stock-chart">
      <h3>Selected Stock Monthly View</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 14, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="rate" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="amount" orientation="right" tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line yAxisId="rate" type="monotone" dataKey="profitRate" stroke="#2563eb" strokeWidth={2} name="Return %" />
          <Line
            yAxisId="amount"
            type="monotone"
            dataKey="evaluationAmount"
            stroke="#16a34a"
            strokeWidth={2}
            name="Evaluation"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
