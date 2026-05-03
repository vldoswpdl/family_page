import cron from 'node-cron';
import { env } from '../config/env';
import { createDailyReport } from './stockInsightService';
import { refreshPortfolio } from './stockPortfolioService';
import { getKiwoomStatus } from './stockNetworkService';
import { sendLatestDailyReport } from './stockTelegramService';

function runJob(name: string, task: () => Promise<unknown>) {
  void task().catch((error) => {
    console.error(`[stock-scheduler] ${name} failed`, error);
  });
}

export function startStockScheduler() {
  if (!env.stockScheduler.enabled) {
    return;
  }

  const mode = env.stockScheduler.mode === 'real' ? 'real' : 'mock';

  cron.schedule(
    env.stockScheduler.ipCheckCron,
    () => runJob('ip-check', () => getKiwoomStatus(mode)),
    { timezone: 'Asia/Seoul' }
  );
  cron.schedule(
    env.stockScheduler.refreshCron,
    () => runJob('refresh-portfolio', () => refreshPortfolio(mode)),
    { timezone: 'Asia/Seoul' }
  );
  cron.schedule(
    env.stockScheduler.reportCron,
    () => runJob('daily-report', () => createDailyReport(mode)),
    { timezone: 'Asia/Seoul' }
  );
  cron.schedule(
    env.stockScheduler.telegramCron,
    () => runJob('telegram-report', () => sendLatestDailyReport(mode)),
    { timezone: 'Asia/Seoul' }
  );
}
