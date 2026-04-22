-- Add cable ampacity tuning columns (defaults preserve existing row behaviour).
ALTER TABLE "AlgorithmSettings" ADD COLUMN "cableCurrentSafetyFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.25;
ALTER TABLE "AlgorithmSettings" ADD COLUMN "ambientTempC" DOUBLE PRECISION NOT NULL DEFAULT 30;
