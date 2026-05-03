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
  googleClientId: getValue('GOOGLE_CLIENT_ID'),
  googleClientSecret: getValue('GOOGLE_CLIENT_SECRET'),
  googleRedirectUri: getValue('GOOGLE_REDIRECT_URI'),
  googleRefreshToken: getValue('GOOGLE_REFRESH_TOKEN')
};

export const isGoogleCalendarConfigured = Boolean(
  env.googleCalendarId &&
    env.googleClientId &&
    env.googleClientSecret &&
    env.googleRedirectUri &&
    env.googleRefreshToken
);
