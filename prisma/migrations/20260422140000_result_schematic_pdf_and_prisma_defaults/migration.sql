-- Rest-Drift vs. prisma/schema.prisma (Legacy-DBs / nachträgliche Schemafelder)
ALTER TABLE "Result" ADD COLUMN IF NOT EXISTS "schematicPdfUrl" TEXT;

ALTER TABLE "AlgorithmSettings" ALTER COLUMN "wpPerM2Rigid" SET DEFAULT 235.0;
ALTER TABLE "AlgorithmSettings" ALTER COLUMN "wpPerM2Flexible" SET DEFAULT 180.0;

ALTER TABLE "AlgorithmTestUserPreset" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "Category" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "ConsumerCategory" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "CreditPurchase" ALTER COLUMN "updatedAt" DROP DEFAULT;
