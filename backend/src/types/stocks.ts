export type StockModeInput = 'mock' | 'real';
export type StockModeDb = 'MOCK' | 'REAL';
export type OpinionTypeInput = 'BUY' | 'SELL' | 'HOLD' | 'WATCH';

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

export interface NormalizedPortfolio {
  mode: StockModeInput;
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
  raw?: unknown;
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

