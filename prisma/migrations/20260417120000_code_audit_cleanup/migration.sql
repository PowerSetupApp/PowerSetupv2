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
--   Idempotent für DBs, die bereits Teile der alten Migrationskette (2025/2026)
--   enthalten — ADD COLUMN IF NOT EXISTS, CREATE INDEX IF NOT EXISTS, Enum/FK
--   per DO/Exception.
-- =============================================================================

-- =============================================================================
-- 1) GenerationStatus Enum + Result-Erweiterung
-- =============================================================================
DO $$ BEGIN
  CREATE TYPE "GenerationStatus" AS ENUM ('idle', 'pending', 'succeeded', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Result" ADD COLUMN IF NOT EXISTS "generationStatus" "GenerationStatus" NOT NULL DEFAULT 'idle';
ALTER TABLE "Result" ADD COLUMN IF NOT EXISTS "generationStartedAt" TIMESTAMP(3);
ALTER TABLE "Result" ADD COLUMN IF NOT EXISTS "generationError" TEXT;

-- Backfill: Reihen mit bereits persistierter Berechnung -> 'succeeded'.
UPDATE "Result"
SET "generationStatus" = 'succeeded'
WHERE "calculations" IS NOT NULL
  AND "recommendations" IS NOT NULL
  AND "generationStatus" = 'idle'::"GenerationStatus";

CREATE INDEX IF NOT EXISTS "Result_createdAt_idx" ON "Result"("createdAt");
CREATE INDEX IF NOT EXISTS "Result_generationStatus_idx" ON "Result"("generationStatus");

-- =============================================================================
-- 2) Money: Float -> Decimal (verlustarm; überspringen wenn schon numeric)
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Product' AND column_name = 'price'
      AND udt_name = 'float8'
  ) THEN
    ALTER TABLE "Product"
      ALTER COLUMN "price" TYPE DECIMAL(12, 2) USING ROUND("price"::numeric, 2);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'CreditPurchase' AND column_name = 'amount'
      AND udt_name = 'float8'
  ) THEN
    ALTER TABLE "CreditPurchase"
      ALTER COLUMN "amount" TYPE DECIMAL(12, 2) USING ROUND("amount"::numeric, 2);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ModelPricing' AND column_name = 'inputPrice'
      AND udt_name = 'float8'
  ) THEN
    ALTER TABLE "ModelPricing"
      ALTER COLUMN "inputPrice" TYPE DECIMAL(12, 6) USING ROUND("inputPrice"::numeric, 6),
      ALTER COLUMN "outputPrice" TYPE DECIMAL(12, 6) USING ROUND("outputPrice"::numeric, 6);
  END IF;
END $$;

-- =============================================================================
-- 3) CreditPurchase: Referenzintegrität + updatedAt
-- =============================================================================
DELETE FROM "CreditPurchase"
WHERE "resultId" NOT IN (SELECT "id" FROM "Result");

DO $$ BEGIN
  ALTER TABLE "CreditPurchase"
    ADD CONSTRAINT "CreditPurchase_resultId_fkey"
    FOREIGN KEY ("resultId") REFERENCES "Result"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "CreditPurchase"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Falls die Spalte existierte aber NULLs erlaubte (Legacy), NOT NULL nachziehen.
UPDATE "CreditPurchase" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;
ALTER TABLE "CreditPurchase" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "CreditPurchase" ALTER COLUMN "updatedAt" SET NOT NULL;

-- =============================================================================
-- 4) Fehlende Timestamps nachziehen
-- =============================================================================
ALTER TABLE "Category"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "ConsumerCategory"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "SystemSetting"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "ModelPricing"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "AlgorithmSettings"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- =============================================================================
-- 5) Business-Uniques (verhindert Duplikate bei Import und ASIN-Scraping)
-- =============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS "Product_asin_key" ON "Product"("asin");
CREATE UNIQUE INDEX IF NOT EXISTS "Brand_name_key" ON "Brand"("name");

-- =============================================================================
-- 6) Zusätzliche Indizes für Admin-Hot-Paths
-- =============================================================================
CREATE INDEX IF NOT EXISTS "PromptVersion_isActive_createdAt_idx"
  ON "PromptVersion"("isActive", "createdAt");

CREATE INDEX IF NOT EXISTS "Brand_isActive_name_idx"
  ON "Brand"("isActive", "name");

CREATE INDEX IF NOT EXISTS "Product_isActive_categoryId_idx"
  ON "Product"("isActive", "categoryId");
