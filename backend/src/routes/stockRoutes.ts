import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { maskSecret, normalizeMode, parseNumber, toDbMode } from '../lib/stockUtils';
import { kiwoomService } from '../services/kiwoomService';
import { generateDailyInsight, getTodayInsight, createDailyReport, listDailyReports } from '../services/stockInsightService';
import {
  createRegisteredIp,
  deleteRegisteredIp,
  getCurrentExternalIp,
  getKiwoomStatus,
  listRegisteredIps,
  updateRegisteredIp
} from '../services/stockNetworkService';
import { getLatestPortfolio, getPortfolioHistory, refreshPortfolio, runBalanceTest } from '../services/stockPortfolioService';
import { sendLatestDailyReport } from '../services/stockTelegramService';
import { OpinionTypeInput } from '../types/stocks';

export const stockRouter = Router();

const OPINION_TYPES = new Set<OpinionTypeInput>(['BUY', 'SELL', 'HOLD', 'WATCH']);

function sanitizePayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizePayload);
  }

  if (typeof value === 'string') {
    return value.replace(/\b\d{8,}\b/g, (match) => maskSecret(match));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nested]) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('token') || lowerKey.includes('secret') || lowerKey.includes('appkey')) {
        return [key, typeof nested === 'string' ? maskSecret(nested) : '[hidden]'];
      }

      if (lowerKey.includes('acnt') || lowerKey.includes('account')) {
        return [key, typeof nested === 'string' ? maskSecret(nested) : sanitizePayload(nested)];
      }

      return [key, sanitizePayload(nested)];
    })
  );
}

async function runTest<T>(action: () => Promise<T>) {
  const startedAt = Date.now();

  try {
    const data = await action();
    return {
      ok: true,
      executionTimeMs: Date.now() - startedAt,
      data: sanitizePayload(data)
    };
  } catch (error) {
    return {
      ok: false,
      executionTimeMs: Date.now() - startedAt,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

stockRouter.post('/test/token', async (req, res) => {
  const result = await runTest(() => kiwoomService.issueToken(req.body?.mode));
  res.status(result.ok ? 200 : 400).json(result);
});

stockRouter.post('/test/account', async (req, res) => {
  const result = await runTest(() => kiwoomService.getAccountList(req.body?.mode));
  res.status(result.ok ? 200 : 400).json(result);
});

stockRouter.post('/test/balance', async (req, res) => {
  const result = await runBalanceTest(req.body?.mode, req.body?.ownerName || 'Family');
  res.json(sanitizePayload(result));
});

stockRouter.get('/portfolio/latest', async (req, res, next) => {
  try {
    const data = await getLatestPortfolio(req.query.mode, typeof req.query.ownerName === 'string' ? req.query.ownerName : undefined);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

stockRouter.get('/portfolio/history', async (req, res, next) => {
  try {
    const data = await getPortfolioHistory(
      req.query.mode,
      typeof req.query.ownerName === 'string' ? req.query.ownerName : undefined,
      typeof req.query.stockCode === 'string' ? req.query.stockCode : undefined
    );
    res.json(data);
  } catch (error) {
    next(error);
  }
});

stockRouter.post('/portfolio/refresh', async (req, res) => {
  const result = await refreshPortfolio(req.body?.mode, req.body?.ownerName || 'Family', req.body?.accountAlias);
  res.json(sanitizePayload(result));
});

stockRouter.get('/network/current-ip', async (_req, res) => {
  try {
    const ip = await getCurrentExternalIp();
    res.json({ currentIp: ip });
  } catch (error) {
    res.status(502).json({
      currentIp: null,
      errorMessage: error instanceof Error ? error.message : 'External IP lookup failed'
    });
  }
});

stockRouter.get('/kiwoom/status', async (req, res, next) => {
  try {
    const data = await getKiwoomStatus(req.query.mode);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

stockRouter.get('/network/registered-ips', async (req, res, next) => {
  try {
    const data = await listRegisteredIps(req.query.mode);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

stockRouter.post('/network/registered-ips', async (req, res) => {
  try {
    const data = await createRegisteredIp(req.body?.mode, req.body?.ip, req.body?.label);
    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({
      errorMessage: error instanceof Error ? error.message : 'Registered IP creation failed'
    });
  }
});

stockRouter.put('/network/registered-ips/:id', async (req, res) => {
  try {
    const data = await updateRegisteredIp(req.params.id, req.body?.ip, req.body?.label, req.body?.isActive);
    res.json(data);
  } catch (error) {
    res.status(400).json({
      errorMessage: error instanceof Error ? error.message : 'Registered IP update failed'
    });
  }
});

stockRouter.delete('/network/registered-ips/:id', async (req, res) => {
  try {
    const data = await deleteRegisteredIp(req.params.id);
    res.json(data);
  } catch (error) {
    res.status(400).json({
      errorMessage: error instanceof Error ? error.message : 'Registered IP delete failed'
    });
  }
});

stockRouter.get('/insight/daily', async (req, res, next) => {
  try {
    const data = await getTodayInsight(req.query.mode);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

stockRouter.post('/insight/generate', async (req, res, next) => {
  try {
    const data = await generateDailyInsight(req.body?.mode, req.body?.ownerName);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

stockRouter.get('/opinion/list', async (req, res, next) => {
  try {
    const stockCode = typeof req.query.stockCode === 'string' ? req.query.stockCode : undefined;
    const ownerName = typeof req.query.ownerName === 'string' ? req.query.ownerName : undefined;
    const data = await prisma.tradeOpinion.findMany({
      where: {
        ...(stockCode ? { stockCode } : {}),
        ...(ownerName ? { ownerName } : {})
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
});

stockRouter.post('/opinion/create', async (req, res, next) => {
  try {
    const opinionType = String(req.body?.opinionType || 'WATCH').toUpperCase() as OpinionTypeInput;
    if (!OPINION_TYPES.has(opinionType)) {
      res.status(400).json({ message: 'Invalid opinion type.' });
      return;
    }

    const data = await prisma.tradeOpinion.create({
      data: {
        ownerName: req.body?.ownerName || 'Family',
        stockCode: req.body?.stockCode || '',
        stockName: req.body?.stockName || '',
        opinionType,
        opinionText: req.body?.opinionText || '',
        riskPoints: req.body?.riskPoints || null,
        targetPrice: req.body?.targetPrice === undefined ? null : parseNumber(req.body.targetPrice),
        stopLossPrice: req.body?.stopLossPrice === undefined ? null : parseNumber(req.body.stopLossPrice)
      }
    });

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

stockRouter.put('/opinion/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const opinionType =
      req.body?.opinionType === undefined ? undefined : (String(req.body.opinionType).toUpperCase() as OpinionTypeInput);

    if (opinionType && !OPINION_TYPES.has(opinionType)) {
      res.status(400).json({ message: 'Invalid opinion type.' });
      return;
    }

    const data = await prisma.tradeOpinion.update({
      where: {
        id
      },
      data: {
        ...(req.body?.ownerName !== undefined ? { ownerName: req.body.ownerName } : {}),
        ...(req.body?.stockCode !== undefined ? { stockCode: req.body.stockCode } : {}),
        ...(req.body?.stockName !== undefined ? { stockName: req.body.stockName } : {}),
        ...(opinionType ? { opinionType } : {}),
        ...(req.body?.opinionText !== undefined ? { opinionText: req.body.opinionText } : {}),
        ...(req.body?.riskPoints !== undefined ? { riskPoints: req.body.riskPoints || null } : {}),
        ...(req.body?.targetPrice !== undefined ? { targetPrice: parseNumber(req.body.targetPrice) } : {}),
        ...(req.body?.stopLossPrice !== undefined ? { stopLossPrice: parseNumber(req.body.stopLossPrice) } : {})
      }
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
});

stockRouter.get('/report/list', async (req, res, next) => {
  try {
    const data = await listDailyReports(req.query.mode);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

stockRouter.post('/report/daily', async (req, res, next) => {
  try {
    const data = await createDailyReport(req.body?.mode);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

stockRouter.post('/report/send-telegram', async (req, res) => {
  try {
    const data = await sendLatestDailyReport(req.body?.mode);
    res.json(sanitizePayload(data));
  } catch (error) {
    res.status(502).json({
      ok: false,
      errorMessage: error instanceof Error ? error.message : 'Telegram send failed'
    });
  }
});

stockRouter.get('/meta', async (req, res) => {
  const mode = normalizeMode(req.query.mode);
  res.json({
    mode,
    dbMode: toDbMode(mode),
    config: kiwoomService.getPublicConfig(mode)
  });
});
