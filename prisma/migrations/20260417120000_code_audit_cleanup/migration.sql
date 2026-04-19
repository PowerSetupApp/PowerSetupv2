-- =============================================================================
-- Code-Audit Cleanup (2026-04-17)
--   * Idempotency-Guard für Result (generationStatus/Enum + Timestamps + Index)
--   * CreditPurchase → Result FK + updatedAt
--   * Money-Felder auf DECIMAL (Float → Decimal) mit präzisem USING-Cast
--   * Zusätzliche Indizes für Hot-Paths (PromptVersion, Brand, Result, Product)
--   * Business-Uniques (Product.asin, Brand.name)
--   * Fehlende Timestamps (Category, ConsumerCategory, SystemSetting.createdAt,
--     ModelPricing.createdAt, AlgorithmSettings.createdAt)
--
--   Alle Änderungen sind idempotent (IF NOT EXISTS / IF EXISTS) wo sinnvoll,
--   damit mehrfache `migrate deploy`-Aufrufe ruhig bleiben.
-- =============================================================================

-- =============================================================================
-- 1) GenerationStatus Enum + Result-Erweiterung
-- =============================================================================
CREATE TYPE "GenerationStatus" AS ENUM ('idle', 'pending', 'succeeded', 'failed');

ALTER TABLE "Result"
  ADD COLUMN "generationStatus" "GenerationStatus" NOT NULL DEFAULT 'idle',
  ADD COLUMN "generationStartedAt" TIMESTAMP(3),
  ADD COLUMN "generationError" TEXT;

-- Backfill: Reihen mit bereits persistierter Berechnung -> 'succeeded'.
UPDATE "Result"
SET "generationStatus" = 'succeeded'
WHERE "calculations" IS NOT NULL
  AND "recommendations" IS NOT NULL;

CREATE INDEX "Result_createdAt_idx" ON "Result"("createdAt");
CREATE INDEX "Result_generationStatus_idx" ON "Result"("generationStatus");

-- =============================================================================
-- 2) Money: Float -> Decimal (verlustarm)
-- =============================================================================
ALTER TABLE "Product"
  ALTER COLUMN "price" TYPE DECIMAL(12, 2) USING ROUND("price"::numeric, 2);

ALTER TABLE "CreditPurchase"
  ALTER COLUMN "amount" TYPE DECIMAL(12, 2) USING ROUND("amount"::numeric, 2);

ALTER TABLE "ModelPricing"
  ALTER COLUMN "inputPrice" TYPE DECIMAL(12, 6) USING ROUND("inputPrice"::numeric, 6),
  ALTER COLUMN "outputPrice" TYPE DECIMAL(12, 6) USING ROUND("outputPrice"::numeric, 6);

-- =============================================================================
-- 3) CreditPurchase: Referenzintegrität + updatedAt
-- =============================================================================
-- Orphan-Cleanup (defensiv — sollte im frischen Baseline leer sein).
DELETE FROM "CreditPurchase"
WHERE "resultId" NOT IN (SELECT "id" FROM "Result");

ALTER TABLE "CreditPurchase"
  ADD CONSTRAINT "CreditPurchase_resultId_fkey"
  FOREIGN KEY ("resultId") REFERENCES "Result"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CreditPurchase"
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- =============================================================================
-- 4) Fehlende Timestamps nachziehen
-- =============================================================================
ALTER TABLE "Category"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "ConsumerCategory"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "SystemSetting"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "ModelPricing"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "AlgorithmSettings"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- =============================================================================
-- 5) Business-Uniques (verhindert Duplikate bei Import und ASIN-Scraping)
--    Product.asin ist nullable — Postgres erlaubt bei UNIQUE mehrfach NULL.
-- =============================================================================
CREATE UNIQUE INDEX "Product_asin_key" ON "Product"("asin");
CREATE UNIQUE INDEX "Brand_name_key"   ON "Brand"("name");

-- =============================================================================
-- 6) Zusätzliche Indizes für Admin-Hot-Paths
-- =============================================================================
CREATE INDEX "PromptVersion_isActive_createdAt_idx"
  ON "PromptVersion"("isActive", "createdAt");

CREATE INDEX "Brand_isActive_name_idx"
  ON "Brand"("isActive", "name");

CREATE INDEX "Product_isActive_categoryId_idx"
  ON "Product"("isActive", "categoryId");
