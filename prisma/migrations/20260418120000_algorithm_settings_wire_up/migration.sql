-- Wire admin ↔ algorithm: remove dead columns, add missing columns.
-- Idempotent für Legacy-DBs (Spalten fehlen schon / neue Spalten schon vorhanden).

ALTER TABLE "AlgorithmSettings" DROP COLUMN IF EXISTS "batteryCompact";
ALTER TABLE "AlgorithmSettings" DROP COLUMN IF EXISTS "batteryMedium";
ALTER TABLE "AlgorithmSettings" DROP COLUMN IF EXISTS "batterySpacious";
ALTER TABLE "AlgorithmSettings" DROP COLUMN IF EXISTS "alternatorEuro6dSmart";
ALTER TABLE "AlgorithmSettings" DROP COLUMN IF EXISTS "alternatorUnknown";

ALTER TABLE "AlgorithmSettings" ADD COLUMN IF NOT EXISTS "locationEastern" DOUBLE PRECISION NOT NULL DEFAULT 0.9;
ALTER TABLE "AlgorithmSettings" ADD COLUMN IF NOT EXISTS "cloudyYieldFactorSummer" DOUBLE PRECISION NOT NULL DEFAULT 0.50;
ALTER TABLE "AlgorithmSettings" ADD COLUMN IF NOT EXISTS "cloudyYieldFactorWinter" DOUBLE PRECISION NOT NULL DEFAULT 0.20;
ALTER TABLE "AlgorithmSettings" ADD COLUMN IF NOT EXISTS "maxPortableWp" INTEGER NOT NULL DEFAULT 400;
ALTER TABLE "AlgorithmSettings" ADD COLUMN IF NOT EXISTS "solarSystemEfficiency" DOUBLE PRECISION NOT NULL DEFAULT 0.85;
ALTER TABLE "AlgorithmSettings" ADD COLUMN IF NOT EXISTS "boosterEfficiency" DOUBLE PRECISION NOT NULL DEFAULT 0.95;
ALTER TABLE "AlgorithmSettings" ADD COLUMN IF NOT EXISTS "alternatorDriveHours" DOUBLE PRECISION NOT NULL DEFAULT 2.0;
