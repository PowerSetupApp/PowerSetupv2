-- Consumer catalog: per-device average load percentage
-- Nullable INT (0..100). NULL oder 100 bedeutet "voller Nennwert".
ALTER TABLE "ConsumerDevice" ADD COLUMN "averageLoadPercent" INTEGER;
