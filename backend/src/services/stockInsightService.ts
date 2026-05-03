import { prisma } from '../lib/prisma';
import { normalizeMode, todayDateOnly, toDbMode } from '../lib/stockUtils';
import { StockHolding, StockInsight } from '../types/stocks';
import { getLatestPortfolio } from './stockPortfolioService';

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

function formatRate(value: number) {
  return `${value.toFixed(2)}%`;
}

export async function generateDailyInsight(modeInput: unknown, ownerName?: string): Promise<StockInsight> {
  const portfolio = await getLatestPortfolio(modeInput, ownerName);
  const totalAsset = portfolio.totalAsset || portfolio.holdings.reduce((sum, holding) => sum + holding.evaluationAmount, 0);
  const stockComments: string[] = [];
  const riskPoints: string[] = [];
  const buySuggestions: string[] = [];
  const sellSuggestions: string[] = [];
  const holdSuggestions: string[] = [];

  for (const holding of portfolio.holdings) {
    const allocation = totalAsset > 0 ? (holding.evaluationAmount / totalAsset) * 100 : 0;
    const commentParts = [`${holding.stockName} 수익률 ${formatRate(holding.profitRate)}`];

    if (holding.profitRate > 20) {
      sellSuggestions.push(`${holding.stockName}: 수익률이 20%를 넘어 일부 이익실현 기준을 점검하세요.`);
      commentParts.push('이익실현 검토 구간');
    } else if (holding.profitRate < -10) {
      buySuggestions.push(`${holding.stockName}: 손실이 10%를 넘어 손절/추가매수 기준을 다시 확인하세요.`);
      commentParts.push('리스크 재점검 필요');
    } else {
      holdSuggestions.push(`${holding.stockName}: 현재 기준에서는 보유 전략과 다음 점검가를 유지하세요.`);
      commentParts.push('보유 관찰 구간');
    }

    if (allocation > 40) {
      riskPoints.push(`${holding.stockName} 비중이 ${formatRate(allocation)}로 높아 집중 리스크가 있습니다.`);
    }

    stockComments.push(commentParts.join(' - '));
  }

  if (!portfolio.holdings.length) {
    stockComments.push('저장된 보유 종목이 없어 종목별 코멘트를 만들 수 없습니다.');
    riskPoints.push('Kiwoom 조회 또는 최초 스냅샷 저장이 필요합니다.');
  }

  if (portfolio.source !== 'kiwoom') {
    riskPoints.push('실시간 데이터가 아닌 최신 저장 데이터를 기준으로 생성된 인사이트입니다.');
  }

  const portfolioSummary = `총자산 ${formatMoney(portfolio.totalAsset)}, 손익 ${formatMoney(portfolio.profitLoss)}, 수익률 ${formatRate(
    portfolio.profitRate
  )}, 보유종목 ${portfolio.holdings.length}개입니다.`;

  const insightText = [
    `데이터 기준: ${portfolio.fetchedAt}`,
    portfolioSummary,
    ...stockComments.map((comment) => `- ${comment}`),
    ...riskPoints.map((risk) => `위험: ${risk}`)
  ].join('\n');

  return {
    dataTimestamp: portfolio.fetchedAt,
    portfolioSummary,
    stockComments,
    buyOpinion: buySuggestions.join('\n') || '신규 매수 의견은 없습니다.',
    sellOpinion: sellSuggestions.join('\n') || '즉시 매도 의견은 없습니다.',
    holdOpinion: holdSuggestions.join('\n') || '보유 의견을 낼 종목이 없습니다.',
    riskPoints,
    insightText
  };
}

export async function getTodayInsight(modeInput: unknown) {
  const mode = normalizeMode(modeInput);
  const report = await prisma.dailyReport.findFirst({
    where: {
      mode: toDbMode(mode),
      reportDate: todayDateOnly()
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  if (report) {
    return {
      dataTimestamp: report.createdAt.toISOString(),
      portfolioSummary: report.portfolioSummary,
      stockComments: report.insightText.split('\n').filter((line) => line.startsWith('- ')),
      buyOpinion: report.buyOpinion || '',
      sellOpinion: report.sellOpinion || '',
      holdOpinion: report.holdOpinion || '',
      riskPoints: report.riskPoints ? report.riskPoints.split('\n') : [],
      insightText: report.insightText
    } satisfies StockInsight;
  }

  return generateDailyInsight(mode);
}

export async function createDailyReport(modeInput: unknown) {
  const mode = normalizeMode(modeInput);
  const insight = await generateDailyInsight(mode);
  const summary = insight.portfolioSummary;

  const report = await prisma.dailyReport.create({
    data: {
      reportDate: todayDateOnly(),
      mode: toDbMode(mode),
      summary,
      portfolioSummary: insight.portfolioSummary,
      insightText: insight.insightText,
      buyOpinion: insight.buyOpinion,
      sellOpinion: insight.sellOpinion,
      holdOpinion: insight.holdOpinion,
      riskPoints: insight.riskPoints.join('\n')
    }
  });

  return report;
}

export async function listDailyReports(modeInput: unknown) {
  const mode = normalizeMode(modeInput);
  return prisma.dailyReport.findMany({
    where: {
      mode: toDbMode(mode)
    },
    orderBy: {
      reportDate: 'desc'
    },
    take: 60
  });
}

export function buildReportMessage(report: {
  reportDate: Date;
  createdAt: Date;
  summary: string;
  portfolioSummary: string;
  insightText: string;
  buyOpinion: string | null;
  sellOpinion: string | null;
  holdOpinion: string | null;
  riskPoints: string | null;
}) {
  return [
    '[Family Stock Daily Report]',
    `Date: ${report.reportDate.toISOString().slice(0, 10)}`,
    `Data timestamp: ${report.createdAt.toISOString()}`,
    '',
    report.portfolioSummary,
    '',
    "Today's insight:",
    report.insightText,
    '',
    'Risk points:',
    report.riskPoints || '- 없음',
    '',
    'Buy/Sell/Hold:',
    report.buyOpinion || '- 매수 의견 없음',
    report.sellOpinion || '- 매도 의견 없음',
    report.holdOpinion || '- 보유 의견 없음'
  ].join('\n');
}

