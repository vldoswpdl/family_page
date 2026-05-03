import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { fromDbMode, normalizeMode, todayDateOnly, toDbMode } from '../lib/stockUtils';
import { kiwoomService } from './kiwoomService';
import { NormalizedPortfolio, StockHolding, StockModeInput } from '../types/stocks';

const FALLBACK_WARNING = 'Real-time API call failed. Showing latest saved data.';

function asHoldings(value: unknown): StockHolding[] {
  return Array.isArray(value) ? (value as StockHolding[]) : [];
}

function snapshotToPortfolio(
  snapshot: NonNullable<Awaited<ReturnType<typeof prisma.portfolioSnapshot.findFirst>>>,
  warning?: string
): NormalizedPortfolio {
  return {
    mode: fromDbMode(snapshot.mode as 'MOCK' | 'REAL'),
    ownerName: snapshot.ownerName,
    accountAlias: snapshot.accountAlias,
    totalAsset: snapshot.totalAsset,
    principalAmount: snapshot.principalAmount,
    profitLoss: snapshot.profitLoss,
    profitRate: snapshot.profitRate,
    holdings: asHoldings(snapshot.holdingsJson),
    fetchedAt: snapshot.fetchedAt.toISOString(),
    source: 'database',
    warning: warning || snapshot.errorMessage || undefined
  };
}

function emptyPortfolio(mode: StockModeInput, ownerName = 'Family'): NormalizedPortfolio {
  const publicConfig = kiwoomService.getPublicConfig(mode);
  return {
    mode,
    ownerName,
    accountAlias: publicConfig.accountAlias,
    totalAsset: 0,
    principalAmount: 0,
    profitLoss: 0,
    profitRate: 0,
    holdings: [],
    fetchedAt: new Date().toISOString(),
    source: 'empty',
    warning: 'No saved portfolio snapshot exists yet.'
  };
}

export async function savePortfolioSnapshot(portfolio: NormalizedPortfolio, status: 'SUCCESS' | 'FAILED' | 'FALLBACK' = 'SUCCESS', errorMessage?: string) {
  const fetchedAt = new Date(portfolio.fetchedAt);
  const snapshotDate = todayDateOnly();

  const snapshot = await prisma.portfolioSnapshot.create({
    data: {
      mode: toDbMode(portfolio.mode),
      ownerName: portfolio.ownerName,
      accountAlias: portfolio.accountAlias,
      totalAsset: portfolio.totalAsset,
      principalAmount: portfolio.principalAmount,
      profitLoss: portfolio.profitLoss,
      profitRate: portfolio.profitRate,
      holdingsJson: portfolio.holdings as unknown as Prisma.InputJsonValue,
      fetchedAt,
      fetchStatus: status,
      errorMessage
    }
  });

  if (status === 'SUCCESS' && portfolio.holdings.length) {
    await prisma.holdingHistory.createMany({
      data: portfolio.holdings.map((holding) => ({
        ownerName: portfolio.ownerName,
        accountAlias: portfolio.accountAlias,
        stockCode: holding.stockCode,
        stockName: holding.stockName,
        quantity: holding.quantity,
        averagePrice: holding.averagePrice,
        currentPrice: holding.currentPrice,
        evaluationAmount: holding.evaluationAmount,
        profitLoss: holding.profitLoss,
        profitRate: holding.profitRate,
        snapshotDate
      }))
    });
  }

  return snapshot;
}

export async function getLatestPortfolio(modeInput: unknown, ownerName?: string) {
  const mode = normalizeMode(modeInput);
  const snapshot = await prisma.portfolioSnapshot.findFirst({
    where: {
      mode: toDbMode(mode),
      ...(ownerName ? { ownerName } : {})
    },
    orderBy: {
      fetchedAt: 'desc'
    }
  });

  return snapshot ? snapshotToPortfolio(snapshot) : emptyPortfolio(mode, ownerName);
}

export async function refreshPortfolio(modeInput: unknown, ownerName = 'Family', accountAlias?: string) {
  const mode = normalizeMode(modeInput);

  try {
    const portfolio = await kiwoomService.getPortfolio(mode, ownerName, accountAlias);
    await savePortfolioSnapshot(portfolio);
    return {
      ok: true,
      portfolio
    };
  } catch (error) {
    const latest = await prisma.portfolioSnapshot.findFirst({
      where: {
        mode: toDbMode(mode),
        ...(ownerName ? { ownerName } : {})
      },
      orderBy: {
        fetchedAt: 'desc'
      }
    });

    const message = error instanceof Error ? error.message : 'Unknown Kiwoom API error';

    await prisma.apiStatusLog.create({
      data: {
        mode: toDbMode(mode),
        apiStatus: 'API_FAILED',
        isIpMatched: false,
        errorMessage: message
      }
    });

    if (latest) {
      return {
        ok: false,
        warning: FALLBACK_WARNING,
        errorMessage: message,
        portfolio: snapshotToPortfolio(latest, FALLBACK_WARNING)
      };
    }

    return {
      ok: false,
      warning: FALLBACK_WARNING,
      errorMessage: message,
      portfolio: emptyPortfolio(mode, ownerName)
    };
  }
}

export async function getPortfolioHistory(modeInput: unknown, ownerName?: string, stockCode?: string) {
  const mode = normalizeMode(modeInput);

  if (stockCode) {
    const rows = await prisma.holdingHistory.findMany({
      where: {
        ...(ownerName ? { ownerName } : {}),
        stockCode
      },
      orderBy: {
        snapshotDate: 'asc'
      },
      take: 180
    });

    return rows.map((row) => ({
      date: row.snapshotDate.toISOString().slice(0, 10),
      stockCode: row.stockCode,
      stockName: row.stockName,
      profitRate: row.profitRate,
      profitLoss: row.profitLoss,
      evaluationAmount: row.evaluationAmount
    }));
  }

  const rows = await prisma.portfolioSnapshot.findMany({
    where: {
      mode: toDbMode(mode),
      ...(ownerName ? { ownerName } : {})
    },
    orderBy: {
      fetchedAt: 'asc'
    },
    take: 180
  });

  return rows.map((row) => ({
    date: row.fetchedAt.toISOString().slice(0, 10),
    profitRate: row.profitRate,
    profitLoss: row.profitLoss,
    totalAsset: row.totalAsset
  }));
}

export async function runBalanceTest(modeInput: unknown, ownerName = 'Family') {
  const startedAt = Date.now();
  const result = await refreshPortfolio(modeInput, ownerName);

  return {
    ...result,
    executionTimeMs: Date.now() - startedAt
  };
}
