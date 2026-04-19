-- Reparatur: Prisma-Schema erwartet `averageLoadPercent` auf ConsumerDevice
-- (Migration 20260418140000), wenn die DB-Historie von den Repo-Migrationen abweicht.
ALTER TABLE "ConsumerDevice" ADD COLUMN IF NOT EXISTS "averageLoadPercent" INTEGER;
