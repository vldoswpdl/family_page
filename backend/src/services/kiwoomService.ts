import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { maskSecret, normalizeMode, parseNumber, pickFirstNumber, pickFirstString, toDbMode } from '../lib/stockUtils';
import { NormalizedPortfolio, StockHolding, StockModeInput } from '../types/stocks';

const KIWOOM_BASE_URLS: Record<StockModeInput, string> = {
  mock: 'https://mockapi.kiwoom.com',
  real: 'https://api.kiwoom.com'
};

type KiwoomConfig = {
  appKey: string;
  secretKey: string;
  accountNo: string;
  registeredIp: string;
};

function assertRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function parseKiwoomDate(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return new Date(Date.now() + 23 * 60 * 60 * 1000);
  }

  const compact = value.replace(/\D/g, '');
  if (compact.length >= 14) {
    const year = Number(compact.slice(0, 4));
    const month = Number(compact.slice(4, 6)) - 1;
    const day = Number(compact.slice(6, 8));
    const hour = Number(compact.slice(8, 10));
    const minute = Number(compact.slice(10, 12));
    const second = Number(compact.slice(12, 14));
    return new Date(year, month, day, hour, minute, second);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(Date.now() + 23 * 60 * 60 * 1000) : parsed;
}

function findArray(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.filter((item) => item && typeof item === 'object') as Record<string, unknown>[];
  }

  const record = assertRecord(value);
  const preferredKeys = [
    'stk_acnt_evlt_remn_indv_tot',
    'acnt_evlt_remn_indv_tot',
    'acnt_evlt_remn_indv',
    'holdings',
    'items',
    'data',
    'list'
  ];

  for (const key of preferredKeys) {
    const maybeArray = record[key];
    if (Array.isArray(maybeArray)) {
      return maybeArray.filter((item) => item && typeof item === 'object') as Record<string, unknown>[];
    }
  }

  return [];
}

function normalizeHolding(item: Record<string, unknown>): StockHolding {
  const stockCode = pickFirstString(item, ['stk_cd', 'stock_code', 'code', '종목코드']).replace(/^A/, '');
  const stockName = pickFirstString(item, ['stk_nm', 'stock_name', 'name', '종목명']) || stockCode || 'Unknown';
  const quantity = pickFirstNumber(item, ['rmnd_qty', 'qty', 'quantity', '보유수량']);
  const averagePrice = pickFirstNumber(item, ['avg_prc', 'pchs_avg_pric', 'average_price', '매입평균가']);
  const currentPrice = pickFirstNumber(item, ['cur_prc', 'now_pric', 'current_price', '현재가']);
  const evaluationAmount = pickFirstNumber(item, ['evlt_amt', 'eval_amt', 'evaluation_amount', '평가금액']);
  const profitLoss = pickFirstNumber(item, ['evltv_prft', 'pl_amt', 'profit_loss', '평가손익']);
  const profitRate = pickFirstNumber(item, ['prft_rt', 'profit_rate', '수익률']);

  return {
    stockCode,
    stockName,
    quantity,
    averagePrice,
    currentPrice,
    evaluationAmount,
    profitLoss,
    profitRate
  };
}

function normalizePortfolioResponse(
  mode: StockModeInput,
  ownerName: string,
  accountAlias: string,
  raw: unknown
): NormalizedPortfolio {
  const record = assertRecord(raw);
  const holdings = findArray(raw).map(normalizeHolding).filter((holding) => holding.stockCode || holding.stockName !== 'Unknown');
  const totalAsset =
    pickFirstNumber(record, ['tot_evlt_amt', 'tot_asset', 'total_asset', '추정예탁자산']) ||
    holdings.reduce((sum, holding) => sum + holding.evaluationAmount, 0);
  const principalAmount =
    pickFirstNumber(record, ['tot_pchs_amt', 'principal_amount', 'purchase_amount', '총매입금액']) ||
    holdings.reduce((sum, holding) => sum + holding.averagePrice * holding.quantity, 0);
  const profitLoss =
    pickFirstNumber(record, ['tot_evlt_pl', 'profit_loss', '총평가손익']) ||
    holdings.reduce((sum, holding) => sum + holding.profitLoss, 0);
  const profitRate =
    pickFirstNumber(record, ['tot_prft_rt', 'profit_rate', '총수익률']) ||
    (principalAmount > 0 ? (profitLoss / principalAmount) * 100 : 0);

  return {
    mode,
    ownerName,
    accountAlias,
    totalAsset,
    principalAmount,
    profitLoss,
    profitRate,
    holdings,
    fetchedAt: new Date().toISOString(),
    source: 'kiwoom',
    raw
  };
}

export class KiwoomService {
  getBaseUrl(modeInput: unknown) {
    return KIWOOM_BASE_URLS[normalizeMode(modeInput)];
  }

  getModeConfig(mode: StockModeInput): KiwoomConfig {
    return mode === 'real' ? env.kiwoom.real : env.kiwoom.mock;
  }

  getPublicConfig(mode: StockModeInput) {
    const config = this.getModeConfig(mode);
    return {
      hasAppKey: Boolean(config.appKey),
      hasSecretKey: Boolean(config.secretKey),
      hasAccountNo: Boolean(config.accountNo),
      accountAlias: config.accountNo ? maskSecret(config.accountNo) : `${mode.toUpperCase()} account`,
      registeredIp: config.registeredIp
    };
  }

  async issueToken(modeInput: unknown) {
    const mode = normalizeMode(modeInput);
    const config = this.getModeConfig(mode);

    if (!config.appKey || !config.secretKey) {
      throw new Error(`${mode.toUpperCase()} Kiwoom app key and secret key are not configured.`);
    }

    const response = await fetch(`${this.getBaseUrl(mode)}/oauth2/token`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json;charset=UTF-8'
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        appkey: config.appKey,
        secretkey: config.secretKey
      })
    });

    const payload = await response.json().catch(() => ({}));
    const body = assertRecord(payload);

    if (!response.ok || (typeof body.return_code === 'number' && body.return_code !== 0)) {
      throw new Error(String(body.return_msg || `Token request failed with ${response.status}`));
    }

    const token = typeof body.token === 'string' ? body.token : '';
    if (!token) {
      throw new Error('Kiwoom token response did not include an access token.');
    }

    const expiresAt = parseKiwoomDate(body.expires_dt);
    const dbMode = toDbMode(mode);

    const saved = await prisma.stockTokenStore.upsert({
      where: {
        mode: dbMode
      },
      update: {
        accessToken: token,
        expiresAt
      },
      create: {
        mode: dbMode,
        accessToken: token,
        expiresAt
      }
    });

    return {
      mode,
      expiresAt: saved.expiresAt.toISOString(),
      tokenPreview: maskSecret(saved.accessToken),
      returnCode: body.return_code ?? 0,
      returnMessage: body.return_msg ?? 'OK'
    };
  }

  async getValidToken(modeInput: unknown) {
    const mode = normalizeMode(modeInput);
    const dbMode = toDbMode(mode);
    const existing = await prisma.stockTokenStore.findUnique({
      where: {
        mode: dbMode
      }
    });

    if (existing && existing.expiresAt.getTime() > Date.now() + 60_000) {
      return existing.accessToken;
    }

    await this.issueToken(mode);
    const refreshed = await prisma.stockTokenStore.findUniqueOrThrow({
      where: {
        mode: dbMode
      }
    });

    return refreshed.accessToken;
  }

  async requestKiwoom(modeInput: unknown, apiId: string, body: Record<string, unknown> = {}) {
    const mode = normalizeMode(modeInput);
    const token = await this.getValidToken(mode);
    const response = await fetch(`${this.getBaseUrl(mode)}/api/dostk/acnt`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json;charset=UTF-8',
        'api-id': apiId
      },
      body: JSON.stringify(body)
    });

    const payload = await response.json().catch(() => ({}));
    const result = assertRecord(payload);

    if (!response.ok || (typeof result.return_code === 'number' && result.return_code !== 0)) {
      throw new Error(String(result.return_msg || `${apiId} request failed with ${response.status}`));
    }

    return result;
  }

  async getAccountList(modeInput: unknown) {
    return this.requestKiwoom(modeInput, 'ka00001');
  }

  async getBalance(modeInput: unknown) {
    const mode = normalizeMode(modeInput);
    const config = this.getModeConfig(mode);
    return this.requestKiwoom(mode, 'kt00018', {
      dmst_stex_tp: 'KRX',
      ...(config.accountNo ? { acnt_no: config.accountNo } : {})
    });
  }

  async getPortfolio(modeInput: unknown, ownerName = 'Family', accountAlias?: string) {
    const mode = normalizeMode(modeInput);
    const config = this.getModeConfig(mode);
    const alias = accountAlias || (config.accountNo ? maskSecret(config.accountNo) : `${mode.toUpperCase()} account`);
    const raw = await this.getBalance(mode);

    return normalizePortfolioResponse(mode, ownerName, alias, raw);
  }
}

export const kiwoomService = new KiwoomService();

