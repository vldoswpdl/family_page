import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env')
];

// Support both `backend/.env` and the shared root `.env` used by docker-compose.
for (const candidate of envCandidates) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate });
    break;
  }
}

function getValue(key: string, fallback = '') {
  return process.env[key] ?? fallback;
}

export const env = {
  port: Number(getValue('PORT', '4000')),
  frontendOrigin: getValue('FRONTEND_ORIGIN', 'http://localhost:5173'),
  databaseUrl: getValue('DATABASE_URL'),
  googleCalendarId: getValue('GOOGLE_CALENDAR_ID'),
  googleCalendarIdPiljae: getValue('GOOGLE_CALENDAR_ID_PILJAE'),
  googleCalendarIdByunghyun: getValue('GOOGLE_CALENDAR_ID_BYUNGHYUN'),
  googleCalendarIdOnyu: getValue('GOOGLE_CALENDAR_ID_ONYU'),
  googleClientId: getValue('GOOGLE_CLIENT_ID'),
  googleClientSecret: getValue('GOOGLE_CLIENT_SECRET'),
  googleRedirectUri: getValue('GOOGLE_REDIRECT_URI'),
  googleRefreshToken: getValue('GOOGLE_REFRESH_TOKEN'),
  kiwoom: {
    mock: {
      appKey: getValue('KIWOOM_APP_KEY_MOCK'),
      secretKey: getValue('KIWOOM_SECRET_KEY_MOCK'),
      accountNo: getValue('KIWOOM_ACCOUNT_NO_MOCK'),
      registeredIp: getValue('KIWOOM_REGISTERED_IP_MOCK')
    },
    real: {
      appKey: getValue('KIWOOM_APP_KEY_REAL'),
      secretKey: getValue('KIWOOM_SECRET_KEY_REAL'),
      accountNo: getValue('KIWOOM_ACCOUNT_NO_REAL'),
      registeredIp: getValue('KIWOOM_REGISTERED_IP_REAL')
    }
  },
  telegram: {
    botToken: getValue('TELEGRAM_BOT_TOKEN'),
    chatId: getValue('TELEGRAM_CHAT_ID')
  },
  stockScheduler: {
    enabled: getValue('STOCK_SCHEDULER_ENABLED', 'false') === 'true',
    mode: getValue('STOCK_SCHEDULER_MODE', 'mock'),
    ipCheckCron: getValue('STOCK_JOB_IP_CHECK_CRON', '50 8 * * 1-5'),
    refreshCron: getValue('STOCK_JOB_REFRESH_CRON', '40 15 * * 1-5'),
    reportCron: getValue('STOCK_JOB_REPORT_CRON', '0 18 * * 1-5'),
    telegramCron: getValue('STOCK_JOB_TELEGRAM_CRON', '10 18 * * 1-5')
  }
};

export const isGoogleCalendarConfigured = Boolean(
  (env.googleCalendarId || env.googleCalendarIdPiljae || env.googleCalendarIdByunghyun || env.googleCalendarIdOnyu) &&
    env.googleClientId &&
    env.googleClientSecret &&
    env.googleRedirectUri &&
    env.googleRefreshToken
);
