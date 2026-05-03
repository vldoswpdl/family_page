import { StockModeDb, StockModeInput } from '../types/stocks';

export const STOCK_MODES = new Set(['mock', 'real']);

export function normalizeMode(value: unknown): StockModeInput {
  return value === 'real' ? 'real' : 'mock';
}

export function toDbMode(mode: StockModeInput): StockModeDb {
  return mode === 'real' ? 'REAL' : 'MOCK';
}

export function fromDbMode(mode: StockModeDb): StockModeInput {
  return mode === 'REAL' ? 'real' : 'mock';
}

export function parseNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== 'string') {
    return 0;
  }

  const normalized = value.replace(/[,+%\s]/g, '').replace(/^--?/, '-');
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

export function todayDateOnly() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function maskSecret(value: string) {
  if (!value) {
    return '';
  }

  if (value.length <= 8) {
    return `${value.slice(0, 2)}***`;
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function pickFirstString(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

export function pickFirstNumber(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    const parsed = parseNumber(value);
    if (parsed !== 0 || value === 0 || value === '0') {
      return parsed;
    }
  }

  return 0;
}

