-- Fix 6 (charger sizing): Overhead für die Absorption-/Taper-Phase des
-- Landstrom-Laders. Steuert den 1+overhead-Faktor in
-- `(batteryAh * DoD * (1 + chargerAbsorptionOverhead)) / chargerTimeHours`.
ALTER TABLE "AlgorithmSettings"
  ADD COLUMN "chargerAbsorptionOverhead" DOUBLE PRECISION NOT NULL DEFAULT 0.15;
