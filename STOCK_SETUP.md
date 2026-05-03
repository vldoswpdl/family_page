# Stock Portfolio Module Setup

The stock portfolio module is mounted beside the existing family schedule page.

- Frontend pages: `/stocks`, `/stocks/admin/test`, `/stocks/reports`, `/stocks/opinions`
- Backend API prefix: `/api/stocks`

## Environment

Add these values to `.env`:

```bash
KIWOOM_APP_KEY_MOCK=
KIWOOM_SECRET_KEY_MOCK=
KIWOOM_ACCOUNT_NO_MOCK=
KIWOOM_APP_KEY_REAL=
KIWOOM_SECRET_KEY_REAL=
KIWOOM_ACCOUNT_NO_REAL=
KIWOOM_REGISTERED_IP_MOCK=
KIWOOM_REGISTERED_IP_REAL=

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

STOCK_SCHEDULER_ENABLED=false
STOCK_SCHEDULER_MODE=mock
STOCK_JOB_IP_CHECK_CRON=50 8 * * 1-5
STOCK_JOB_REFRESH_CRON=40 15 * * 1-5
STOCK_JOB_REPORT_CRON=0 18 * * 1-5
STOCK_JOB_TELEGRAM_CRON=10 18 * * 1-5
```

## Commands

```bash
cd backend
npm install
npm run db:generate
npm run db:deploy
npm run build

cd ../frontend
npm install
npm run build
```

Start the app as before:

```bash
cd backend
npm run dev

cd ../frontend
npm run dev
```

Kiwoom credentials, tokens, account numbers, and Telegram bot tokens stay in backend `.env`. The frontend calls only `/api/stocks/*`.
