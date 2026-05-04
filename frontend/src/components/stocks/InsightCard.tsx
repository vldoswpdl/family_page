import { StockInsight, TradeOpinion } from '../../types/stocks';

function opinionLabel(type: string) {
  if (type === 'BUY') return '매수';
  if (type === 'SELL') return '매도';
  if (type === 'HOLD') return '보유';
  if (type === 'WATCH') return '관망';
  return type;
}

interface InsightCardProps {
  insight: StockInsight | null;
  opinions: TradeOpinion[];
}

export function InsightCard({ insight, opinions }: InsightCardProps) {
  return (
    <section className="stock-panel">
      <div className="stock-section-title">
        <div>
          <span>일일 인사이트</span>
          <h2>규칙 기반 포트폴리오 메모</h2>
        </div>
        <small>{insight?.dataTimestamp ? `기준 ${new Date(insight.dataTimestamp).toLocaleString()}` : '아직 생성된 리포트 없음'}</small>
      </div>

      {insight ? (
        <div className="stock-insight-grid">
          <article>
            <strong>요약</strong>
            <p>{insight.portfolioSummary}</p>
          </article>
          <article>
            <strong>매수</strong>
            <p>{insight.buyOpinion}</p>
          </article>
          <article>
            <strong>매도</strong>
            <p>{insight.sellOpinion}</p>
          </article>
          <article>
            <strong>보유</strong>
            <p>{insight.holdOpinion}</p>
          </article>
        </div>
      ) : (
        <div className="stock-empty">아직 생성된 인사이트가 없습니다.</div>
      )}

      <div className="stock-opinion-strip">
        {opinions.slice(0, 4).map((opinion) => (
          <article key={opinion.id} className={`stock-opinion ${opinion.opinionType.toLowerCase()}`}>
            <span>{opinionLabel(opinion.opinionType)}</span>
            <strong>{opinion.stockName || opinion.stockCode}</strong>
            <p>{opinion.opinionText}</p>
          </article>
        ))}
        {!opinions.length ? <div className="stock-empty compact">저장된 의견이 없습니다.</div> : null}
      </div>
    </section>
  );
}
