import { StockInsight, TradeOpinion } from '../../types/stocks';

interface InsightCardProps {
  insight: StockInsight | null;
  opinions: TradeOpinion[];
}

export function InsightCard({ insight, opinions }: InsightCardProps) {
  return (
    <section className="stock-panel">
      <div className="stock-section-title">
        <div>
          <span>Daily Insight</span>
          <h2>Rule-based portfolio notes</h2>
        </div>
        <small>{insight?.dataTimestamp ? `Data ${new Date(insight.dataTimestamp).toLocaleString()}` : 'No report yet'}</small>
      </div>

      {insight ? (
        <div className="stock-insight-grid">
          <article>
            <strong>Summary</strong>
            <p>{insight.portfolioSummary}</p>
          </article>
          <article>
            <strong>Buy</strong>
            <p>{insight.buyOpinion}</p>
          </article>
          <article>
            <strong>Sell</strong>
            <p>{insight.sellOpinion}</p>
          </article>
          <article>
            <strong>Hold</strong>
            <p>{insight.holdOpinion}</p>
          </article>
        </div>
      ) : (
        <div className="stock-empty">No insight generated yet.</div>
      )}

      <div className="stock-opinion-strip">
        {opinions.slice(0, 4).map((opinion) => (
          <article key={opinion.id} className={`stock-opinion ${opinion.opinionType.toLowerCase()}`}>
            <span>{opinion.opinionType}</span>
            <strong>{opinion.stockName || opinion.stockCode}</strong>
            <p>{opinion.opinionText}</p>
          </article>
        ))}
        {!opinions.length ? <div className="stock-empty compact">No saved opinions.</div> : null}
      </div>
    </section>
  );
}

