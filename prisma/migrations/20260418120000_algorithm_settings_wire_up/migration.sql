-- Wire admin ↔ algorithm: remove dead columns, add missing columns.
-- Dropped: batteryCompact/Medium/Spacious (Batterie-Platz group),
--          alternatorEuro6dSmart, alternatorUnknown (booster tiers simplified to standard/enhanced).
-- Added:   locationEastern, cloudyYieldFactorSummer/Winter, maxPortableWp,
--          solarSystemEfficiency, boosterEfficiency, alternatorDriveHours.

ALTER TABLE "AlgorithmSettings" DROP COLUMN "batteryCompact";
ALTER TABLE "AlgorithmSettings" DROP COLUMN "batteryMedium";
ALTER TABLE "AlgorithmSettings" DROP COLUMN "batterySpacious";
ALTER TABLE "AlgorithmSettings" DROP COLUMN "alternatorEuro6dSmart";
ALTER TABLE "AlgorithmSettings" DROP COLUMN "alternatorUnknown";

ALTER TABLE "AlgorithmSettings" ADD COLUMN "locationEastern" DOUBLE PRECISION NOT NULL DEFAULT 0.9;
ALTER TABLE "AlgorithmSettings" ADD COLUMN "cloudyYieldFactorSummer" DOUBLE PRECISION NOT NULL DEFAULT 0.50;
ALTER TABLE "AlgorithmSettings" ADD COLUMN "cloudyYieldFactorWinter" DOUBLE PRECISION NOT NULL DEFAULT 0.20;
ALTER TABLE "AlgorithmSettings" ADD COLUMN "maxPortableWp" INTEGER NOT NULL DEFAULT 400;
ALTER TABLE "AlgorithmSettings" ADD COLUMN "solarSystemEfficiency" DOUBLE PRECISION NOT NULL DEFAULT 0.85;
ALTER TABLE "AlgorithmSettings" ADD COLUMN "boosterEfficiency" DOUBLE PRECISION NOT NULL DEFAULT 0.95;
ALTER TABLE "AlgorithmSettings" ADD COLUMN "alternatorDriveHours" DOUBLE PRECISION NOT NULL DEFAULT 2.0;
