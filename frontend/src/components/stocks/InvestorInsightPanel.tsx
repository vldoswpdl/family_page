import { StockHolding, StockPortfolio } from '../../types/stocks';

function money(value: number) {
  return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

function allocation(holding: StockHolding, totalAsset: number) {
  return totalAsset > 0 ? (holding.evaluationAmount / totalAsset) * 100 : 0;
}

interface InvestorInsightPanelProps {
  portfolio: StockPortfolio;
}

export function InvestorInsightPanel({ portfolio }: InvestorInsightPanelProps) {
  const holdings = [...portfolio.holdings];
  const totalHoldingAmount = holdings.reduce((sum, holding) => sum + holding.evaluationAmount, 0);
  const cashBuffer = Math.max(portfolio.totalAsset - totalHoldingAmount, 0);
  const cashRate = portfolio.totalAsset > 0 ? (cashBuffer / portfolio.totalAsset) * 100 : 0;
  const topWinner = [...holdings].sort((left, right) => right.profitLoss - left.profitLoss)[0];
  const topLoser = [...holdings].sort((left, right) => left.profitLoss - right.profitLoss)[0];
  const concentration = [...holdings].sort((left, right) => allocation(right, portfolio.totalAsset) - allocation(left, portfolio.totalAsset))[0];
  const lossCount = holdings.filter((holding) => holding.profitRate <= -10).length;
  const profitTakingCount = holdings.filter((holding) => holding.profitRate >= 20).length;

  const cards = [
    {
      label: '현금 여력',
      title: `${cashRate.toFixed(1)}%`,
      text: `${money(cashBuffer)} 정도가 현금 또는 예수금 성격으로 남아 있습니다.`
    },
    {
      label: '수익 기여 1위',
      title: topWinner ? topWinner.stockName : '데이터 없음',
      text: topWinner ? `${money(topWinner.profitLoss)} / ${topWinner.profitRate.toFixed(2)}%` : '수익 기여 종목이 없습니다.'
    },
    {
      label: '손실 영향 1위',
      title: topLoser ? topLoser.stockName : '데이터 없음',
      text: topLoser ? `${money(topLoser.profitLoss)} / ${topLoser.profitRate.toFixed(2)}%` : '손실 종목이 없습니다.'
    },
    {
      label: '집중도',
      title: concentration ? concentration.stockName : '데이터 없음',
      text: concentration ? `포트폴리오 비중 ${allocation(concentration, portfolio.totalAsset).toFixed(1)}%입니다.` : '비중 분석 대상이 없습니다.'
    },
    {
      label: '점검 대상',
      title: `${lossCount + profitTakingCount}개`,
      text: `손실 점검 ${lossCount}개, 이익실현 검토 ${profitTakingCount}개입니다.`
    },
    {
      label: '기록 기준',
      title: portfolio.source === 'kiwoom' ? '실시간 데이터' : '저장 데이터',
      text: `기준 시각은 ${new Date(portfolio.fetchedAt).toLocaleString()}입니다.`
    }
  ];

  return (
    <section className="stock-panel">
      <div className="stock-section-title">
        <div>
          <span>투자자 노트</span>
          <h2>기록 기반 인사이트</h2>
        </div>
        <small>비중, 현금, 기여도</small>
      </div>
      <div className="stock-investor-grid">
        {cards.map((card) => (
          <article key={card.label}>
            <span>{card.label}</span>
            <strong>{card.title}</strong>
            <p>{card.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
