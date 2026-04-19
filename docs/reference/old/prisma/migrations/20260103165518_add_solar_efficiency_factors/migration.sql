-- AlterTable
ALTER TABLE "AlgorithmSettings" ADD COLUMN     "batterySafetyFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.3,
ADD COLUMN     "chargerTimeHoursFast" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
ADD COLUMN     "chargerTimeHoursNormal" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
ADD COLUMN     "chargerTimeHoursSlow" DOUBLE PRECISION NOT NULL DEFAULT 8.0,
ADD COLUMN     "cloudyYieldFactor" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
ADD COLUMN     "maxBackupDays" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "portableOrientationFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "recommendedSolarYieldFactor" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
ADD COLUMN     "roofOrientationFactor" DOUBLE PRECISION NOT NULL DEFAULT 0.85,
ADD COLUMN     "roofUtilizationFactor" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
ADD COLUMN     "solarSafetyFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.1,
ADD COLUMN     "standingDaysLong" INTEGER NOT NULL DEFAULT 14,
ADD COLUMN     "standingDaysMedium" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "standingDaysShort" INTEGER NOT NULL DEFAULT 3;

-- AlterTable
ALTER TABLE "ConsumerDevice" ALTER COLUMN "showFixedOption" SET DEFAULT false;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "asin" TEXT,
ADD COLUMN     "batteryType" TEXT,
ADD COLUMN     "brandId" TEXT,
ADD COLUMN     "capacityAh" INTEGER,
ADD COLUMN     "crossSectionMm2" DOUBLE PRECISION,
ADD COLUMN     "currentA" INTEGER,
ADD COLUMN     "fuseType" TEXT,
ADD COLUMN     "maxDischargeA" INTEGER,
ADD COLUMN     "powerW" INTEGER,
ADD COLUMN     "solarWp" INTEGER,
ADD COLUMN     "supportedVoltages" JSONB,
ADD COLUMN     "voltageV" INTEGER,
ADD COLUMN     "waveform" TEXT,
ALTER COLUMN "affiliateUrl" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "showInPreferences" BOOLEAN NOT NULL DEFAULT true,
    "types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "type" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandFilterCategory" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "categorySlugs" TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandFilterCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrandFilterCategory_key_key" ON "BrandFilterCategory"("key");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
