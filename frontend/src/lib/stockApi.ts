import {
  ApiTestResult,
  DailyReport,
  KiwoomStatus,
  PortfolioHistoryPoint,
  RegisteredIp,
  StockInsight,
  StockMode,
  StockPortfolio,
  TradeOpinion
} from '../types/stocks';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const STOCK_API = `${API_BASE_URL}/stocks`;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${STOCK_API}${path}`, {
    headers: {
      'content-type': 'application/json',
      ...(options?.headers ?? {})
    },
    ...options
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'errorMessage' in payload
        ? String((payload as { errorMessage: unknown }).errorMessage)
        : `Request failed with ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export function fetchStockPortfolio(mode: StockMode, ownerName?: string) {
  const params = new URLSearchParams({ mode });
  if (ownerName) {
    params.set('ownerName', ownerName);
  }
  return request<StockPortfolio>(`/portfolio/latest?${params.toString()}`);
}

export function fetchPortfolioHistory(mode: StockMode, ownerName?: string, stockCode?: string) {
  const params = new URLSearchParams({ mode });
  if (ownerName) {
    params.set('ownerName', ownerName);
  }
  if (stockCode) {
    params.set('stockCode', stockCode);
  }
  return request<PortfolioHistoryPoint[]>(`/portfolio/history?${params.toString()}`);
}

export function refreshStockPortfolio(mode: StockMode, ownerName = 'Family') {
  return request<ApiTestResult>('/portfolio/refresh', {
    method: 'POST',
    body: JSON.stringify({ mode, ownerName })
  });
}

export function fetchKiwoomStatus(mode: StockMode) {
  return request<KiwoomStatus>(`/kiwoom/status?mode=${mode}`);
}

export function fetchDailyInsight(mode: StockMode) {
  return request<StockInsight>(`/insight/daily?mode=${mode}`);
}

export function generateDailyInsight(mode: StockMode) {
  return request<StockInsight>('/insight/generate', {
    method: 'POST',
    body: JSON.stringify({ mode })
  });
}

export function runStockTest(action: 'token' | 'account' | 'balance', mode: StockMode) {
  return request<ApiTestResult>(`/test/${action}`, {
    method: 'POST',
    body: JSON.stringify({ mode })
  });
}

export function fetchOpinions(params?: { ownerName?: string; stockCode?: string }) {
  const query = new URLSearchParams();
  if (params?.ownerName) {
    query.set('ownerName', params.ownerName);
  }
  if (params?.stockCode) {
    query.set('stockCode', params.stockCode);
  }
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request<TradeOpinion[]>(`/opinion/list${suffix}`);
}

export function createOpinion(input: Partial<TradeOpinion>) {
  return request<TradeOpinion>('/opinion/create', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export function updateOpinion(id: number, input: Partial<TradeOpinion>) {
  return request<TradeOpinion>(`/opinion/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input)
  });
}

export function fetchReports(mode: StockMode) {
  return request<DailyReport[]>(`/report/list?mode=${mode}`);
}

export function createDailyReport(mode: StockMode) {
  return request<DailyReport>('/report/daily', {
    method: 'POST',
    body: JSON.stringify({ mode })
  });
}

export function sendTelegramReport(mode: StockMode) {
  return request<ApiTestResult>('/report/send-telegram', {
    method: 'POST',
    body: JSON.stringify({ mode })
  });
}

export function fetchRegisteredIps(mode: StockMode) {
  return request<RegisteredIp[]>(`/network/registered-ips?mode=${mode}`);
}

export function createRegisteredIp(input: { mode: StockMode; ip: string; label?: string }) {
  return request<RegisteredIp>('/network/registered-ips', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export function updateRegisteredIp(id: number, input: { ip: string; label?: string; isActive: boolean }) {
  return request<RegisteredIp>(`/network/registered-ips/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input)
  });
}

export function deleteRegisteredIp(id: number) {
  return request<RegisteredIp>(`/network/registered-ips/${id}`, {
    method: 'DELETE'
  });
}
