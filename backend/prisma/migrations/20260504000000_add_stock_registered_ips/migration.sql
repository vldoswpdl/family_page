CREATE TABLE "stock_registered_ip" (
  "id" SERIAL NOT NULL,
  "mode" "StockMode" NOT NULL,
  "ip" TEXT NOT NULL,
  "label" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "stock_registered_ip_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "stock_registered_ip_mode_ip_key" ON "stock_registered_ip"("mode", "ip");
CREATE INDEX "stock_registered_ip_mode_isActive_idx" ON "stock_registered_ip"("mode", "isActive");

INSERT INTO "stock_registered_ip" ("mode", "ip", "label", "isActive", "updatedAt")
VALUES ('REAL', '124.59.176.5', 'Home fixed IP', true, CURRENT_TIMESTAMP)
ON CONFLICT ("mode", "ip") DO NOTHING;
