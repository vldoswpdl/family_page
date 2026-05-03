import { StockHolding } from '../../types/stocks';

function getOpinion(holding: StockHolding, totalAsset: number) {
  const allocation = totalAsset > 0 ? (holding.evaluationAmount / totalAsset) * 100 : 0;

  if (holding.profitRate >= 20) {
    return {
      type: 'SELL',
      title: 'Partial profit-taking check',
      text: `${holding.stockName} 수익률이 ${holding.profitRate.toFixed(2)}%입니다. 일부 이익실현 기준과 보유 목표를 점검하세요.`,
      risk: allocation >= 30 ? `비중 ${allocation.toFixed(1)}%로 집중 리스크도 함께 확인하세요.` : '상승 후 변동성 확대에 대비하세요.'
    };
  }

  if (holding.profitRate <= -10) {
    return {
      type: 'WATCH',
      title: 'Loss plan review',
      text: `${holding.stockName} 손실률이 ${holding.profitRate.toFixed(2)}%입니다. 추가매수보다 손절 기준과 투자 이유 훼손 여부를 먼저 확인하세요.`,
      risk: allocation >= 20 ? `손실 종목 비중이 ${allocation.toFixed(1)}%입니다.` : '추가 하락 시 대응 가격을 미리 정하세요.'
    };
  }

  if (allocation >= 40) {
    return {
      type: 'HOLD',
      title: 'Concentration check',
      text: `${holding.stockName}는 수익률보다 비중 관리가 중요합니다. 신규 매수는 천천히 판단하세요.`,
      risk: `현재 비중 ${allocation.toFixed(1)}%로 포트폴리오 영향도가 큽니다.`
    };
  }

  return {
    type: 'HOLD',
    title: 'Hold and monitor',
    text: `${holding.stockName}는 오늘 기준 보유 관찰 구간입니다. 매수/매도보다 다음 점검 가격을 유지하세요.`,
    risk: '큰 리스크 신호는 없지만 시장 급변 시 재점검하세요.'
  };
}

interface DailyOpinionBoardProps {
  holdings: StockHolding[];
  totalAsset: number;
}

export function DailyOpinionBoard({ holdings, totalAsset }: DailyOpinionBoardProps) {
  if (!holdings.length) {
    return (
      <section className="stock-panel">
        <div className="stock-section-title">
          <div>
            <span>Daily Buy / Sell Opinion</span>
            <h2>오늘의 종목 의견</h2>
          </div>
        </div>
        <div className="stock-empty">보유 종목을 먼저 새로고침하세요.</div>
      </section>
    );
  }

  return (
    <section className="stock-panel">
      <div className="stock-section-title">
        <div>
          <span>Daily Buy / Sell Opinion</span>
          <h2>오늘의 종목별 판단</h2>
        </div>
        <small>{new Date().toLocaleDateString()}</small>
      </div>
      <div className="stock-daily-opinion-grid">
        {holdings.map((holding) => {
          const opinion = getOpinion(holding, totalAsset);

          return (
            <article key={holding.stockCode} className={`stock-daily-opinion ${opinion.type.toLowerCase()}`}>
              <span>{opinion.type}</span>
              <strong>{holding.stockName}</strong>
              <small>{opinion.title}</small>
              <p>{opinion.text}</p>
              <em>{opinion.risk}</em>
            </article>
          );
        })}
      </div>
    </section>
  );
}

