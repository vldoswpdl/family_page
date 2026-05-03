import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { normalizeMode, toDbMode } from '../lib/stockUtils';
import { buildReportMessage, createDailyReport } from './stockInsightService';

export async function sendLatestDailyReport(modeInput: unknown) {
  const mode = normalizeMode(modeInput);

  if (!env.telegram.botToken || !env.telegram.chatId) {
    throw new Error('Telegram bot token and chat id are not configured.');
  }

  let report = await prisma.dailyReport.findFirst({
    where: {
      mode: toDbMode(mode)
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  if (!report) {
    report = await createDailyReport(mode);
  }

  const response = await fetch(`https://api.telegram.org/bot${env.telegram.botToken}/sendMessage`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: env.telegram.chatId,
      text: buildReportMessage(report)
    })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`Telegram send failed with ${response.status}`);
  }

  const updated = await prisma.dailyReport.update({
    where: {
      id: report.id
    },
    data: {
      sentToTelegram: true,
      telegramSentAt: new Date()
    }
  });

  return {
    ok: true,
    report: updated,
    telegram: payload
  };
}

