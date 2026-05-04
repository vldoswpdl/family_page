import { StockHolding } from '../../types/stocks';

function opinionLabel(type: string) {
  if (type === 'SELL') return '매도 검토';
  if (type === 'WATCH') return '관망';
  return '보유';
}

function getOpinion(holding: StockHolding, totalAsset: number) {
  const allocation = totalAsset > 0 ? (holding.evaluationAmount / totalAsset) * 100 : 0;

  if (holding.profitRate >= 20) {
    return {
      type: 'SELL',
      title: '부분 이익실현 검토',
      text: `${holding.stockName} 수익률이 ${holding.profitRate.toFixed(2)}%입니다. 일부 이익실현 기준과 계속 보유할 이유를 함께 점검하세요.`,
      risk: allocation >= 30 ? `비중이 ${allocation.toFixed(1)}%로 높습니다. 집중 리스크도 같이 확인하세요.` : '상승 후 변동성 확대 가능성에 대비하세요.'
    };
  }

  if (holding.profitRate <= -10) {
    return {
      type: 'WATCH',
      title: '손실 대응 계획 점검',
      text: `${holding.stockName} 손실률이 ${holding.profitRate.toFixed(2)}%입니다. 추가 매수보다 손절 기준과 투자 이유가 유지되는지 먼저 확인하세요.`,
      risk: allocation >= 20 ? `손실 종목 비중이 ${allocation.toFixed(1)}%입니다.` : '추가 하락 시 대응 가격을 미리 정해두세요.'
    };
  }

  if (allocation >= 40) {
    return {
      type: 'HOLD',
      title: '비중 집중 점검',
      text: `${holding.stockName}은 수익률보다 비중 관리가 중요합니다. 신규 매수는 신중하게 판단하세요.`,
      risk: `현재 비중이 ${allocation.toFixed(1)}%로 포트폴리오 영향도가 큽니다.`
    };
  }

  return {
    type: 'HOLD',
    title: '보유 및 관찰',
    text: `${holding.stockName}은 오늘 기준 보유 관찰 구간입니다. 매수/매도보다 다음 평가 가격을 먼저 지정하세요.`,
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
            <span>일일 매수 / 매도 의견</span>
            <h2>오늘의 종목 의견</h2>
          </div>
        </div>
        <div className="stock-empty">보유 종목을 먼저 불러와 주세요.</div>
      </section>
    );
  }

  return (
    <section className="stock-panel">
      <div className="stock-section-title">
        <div>
          <span>일일 매수 / 매도 의견</span>
          <h2>오늘의 종목별 판단</h2>
        </div>
        <small>{new Date().toLocaleDateString()}</small>
      </div>
      <div className="stock-daily-opinion-grid">
        {holdings.map((holding) => {
          const opinion = getOpinion(holding, totalAsset);

          return (
            <article key={holding.stockCode} className={`stock-daily-opinion ${opinion.type.toLowerCase()}`}>
              <span>{opinionLabel(opinion.type)}</span>
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
