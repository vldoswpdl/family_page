CREATE TYPE "StockMode" AS ENUM ('MOCK', 'REAL');
CREATE TYPE "PortfolioFetchStatus" AS ENUM ('SUCCESS', 'FAILED', 'FALLBACK');
CREATE TYPE "OpinionType" AS ENUM ('BUY', 'SELL', 'HOLD', 'WATCH');

CREATE TABLE "stock_token_store" (
  "id" SERIAL NOT NULL,
  "mode" "StockMode" NOT NULL,
  "accessToken" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ(6) NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "stock_token_store_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "stock_token_store_mode_key" ON "stock_token_store"("mode");

CREATE TABLE "portfolio_snapshot" (
  "id" SERIAL NOT NULL,
  "mode" "StockMode" NOT NULL,
  "ownerName" TEXT NOT NULL,
  "accountAlias" TEXT NOT NULL,
  "totalAsset" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "principalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "profitLoss" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "profitRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "holdingsJson" JSONB NOT NULL,
  "fetchedAt" TIMESTAMPTZ(6) NOT NULL,
  "fetchStatus" "PortfolioFetchStatus" NOT NULL DEFAULT 'SUCCESS',
  "errorMessage" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "portfolio_snapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "portfolio_snapshot_mode_ownerName_fetchedAt_idx" ON "portfolio_snapshot"("mode", "ownerName", "fetchedAt");

CREATE TABLE "holding_history" (
  "id" SERIAL NOT NULL,
  "ownerName" TEXT NOT NULL,
  "accountAlias" TEXT NOT NULL,
  "stockCode" TEXT NOT NULL,
  "stockName" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "averagePrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currentPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "evaluationAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "profitLoss" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "profitRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "snapshotDate" DATE NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "holding_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "holding_history_ownerName_stockCode_snapshotDate_idx" ON "holding_history"("ownerName", "stockCode", "snapshotDate");

CREATE TABLE "trade_opinion" (
  "id" SERIAL NOT NULL,
  "ownerName" TEXT NOT NULL,
  "stockCode" TEXT NOT NULL,
  "stockName" TEXT NOT NULL,
  "opinionType" "OpinionType" NOT NULL,
  "opinionText" TEXT NOT NULL,
  "riskPoints" TEXT,
  "targetPrice" DOUBLE PRECISION,
  "stopLossPrice" DOUBLE PRECISION,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "trade_opinion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "trade_opinion_ownerName_stockCode_createdAt_idx" ON "trade_opinion"("ownerName", "stockCode", "createdAt");

CREATE TABLE "daily_report" (
  "id" SERIAL NOT NULL,
  "reportDate" DATE NOT NULL,
  "mode" "StockMode" NOT NULL,
  "summary" TEXT NOT NULL,
  "portfolioSummary" TEXT NOT NULL,
  "insightText" TEXT NOT NULL,
  "buyOpinion" TEXT,
  "sellOpinion" TEXT,
  "holdOpinion" TEXT,
  "riskPoints" TEXT,
  "sentToTelegram" BOOLEAN NOT NULL DEFAULT false,
  "telegramSentAt" TIMESTAMPTZ(6),
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "daily_report_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "daily_report_mode_reportDate_idx" ON "daily_report"("mode", "reportDate");

CREATE TABLE "api_status_log" (
  "id" SERIAL NOT NULL,
  "mode" "StockMode" NOT NULL,
  "currentIp" TEXT,
  "registeredIp" TEXT,
  "isIpMatched" BOOLEAN NOT NULL DEFAULT false,
  "apiStatus" TEXT NOT NULL,
  "errorMessage" TEXT,
  "checkedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "api_status_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "api_status_log_mode_checkedAt_idx" ON "api_status_log"("mode", "checkedAt");
