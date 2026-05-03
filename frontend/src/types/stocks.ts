export type StockMode = 'mock' | 'real';
export type OpinionType = 'BUY' | 'SELL' | 'HOLD' | 'WATCH';

export interface StockHolding {
  stockCode: string;
  stockName: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  evaluationAmount: number;
  profitLoss: number;
  profitRate: number;
}

export interface StockPortfolio {
  mode: StockMode;
  ownerName: string;
  accountAlias: string;
  totalAsset: number;
  principalAmount: number;
  profitLoss: number;
  profitRate: number;
  holdings: StockHolding[];
  fetchedAt: string;
  source: 'kiwoom' | 'database' | 'empty';
  warning?: string;
}

export interface PortfolioHistoryPoint {
  date: string;
  profitRate: number;
  profitLoss: number;
  stockCode?: string;
  stockName?: string;
  totalAsset?: number;
  evaluationAmount?: number;
}

export interface KiwoomStatus {
  mode: StockMode;
  currentIp: string | null;
  registeredIp: string | null;
  isIpMatched: boolean;
  apiStatus: string;
  tokenStatus: {
    exists: boolean;
    expiresAt: string | null;
    isExpired: boolean;
  };
  lastSuccessfulFetchAt: string | null;
  checkedAt: string;
  errorMessage: string | null;
}

export interface StockInsight {
  dataTimestamp: string | null;
  portfolioSummary: string;
  stockComments: string[];
  buyOpinion: string;
  sellOpinion: string;
  holdOpinion: string;
  riskPoints: string[];
  insightText: string;
}

export interface TradeOpinion {
  id: number;
  ownerName: string;
  stockCode: string;
  stockName: string;
  opinionType: OpinionType;
  opinionText: string;
  riskPoints: string | null;
  targetPrice: number | null;
  stopLossPrice: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface DailyReport {
  id: number;
  reportDate: string;
  mode: 'MOCK' | 'REAL';
  summary: string;
  portfolioSummary: string;
  insightText: string;
  buyOpinion: string | null;
  sellOpinion: string | null;
  holdOpinion: string | null;
  riskPoints: string | null;
  sentToTelegram: boolean;
  telegramSentAt: string | null;
  createdAt: string;
}

export interface ApiTestResult {
  ok: boolean;
  executionTimeMs?: number;
  data?: unknown;
  errorMessage?: string;
  warning?: string;
  portfolio?: StockPortfolio;
}
