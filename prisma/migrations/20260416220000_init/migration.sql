-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "formData" JSONB NOT NULL,
    "calculations" JSONB,
    "recommendations" JSONB,
    "schematicData" JSONB,
    "schematicImageUrl" TEXT,
    "schematicPdfUrl" TEXT,
    "aiModel" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "imageUrl" TEXT,
    "affiliateUrl" TEXT,
    "asin" TEXT,
    "price" DOUBLE PRECISION,
    "categoryId" TEXT NOT NULL,
    "specVersion" INTEGER NOT NULL DEFAULT 1,
    "specs" TEXT NOT NULL DEFAULT '',
    "powerW" INTEGER,
    "capacityAh" INTEGER,
    "voltageV" INTEGER,
    "batteryType" TEXT,
    "currentA" INTEGER,
    "crossSectionMm2" DOUBLE PRECISION,
    "solarWp" INTEGER,
    "supportedVoltages" JSONB,
    "maxDischargeA" INTEGER,
    "waveform" TEXT,
    "fuseType" TEXT,
    "filterValues" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "brandId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryFilter" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "unit" TEXT,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryFilter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditPurchase" (
    "id" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "paypalOrderId" TEXT NOT NULL,
    "paypalStatus" TEXT NOT NULL,
    "packageType" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditBalance" (
    "id" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditUsage" (
    "id" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptVersion" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "userPromptTemplate" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsumerCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ConsumerCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsumerDevice" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "i18nKey" TEXT,
    "icon" TEXT,
    "defaultPower" INTEGER NOT NULL DEFAULT 50,
    "defaultVoltage" TEXT NOT NULL DEFAULT '12V',
    "defaultHoursPerDay" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "stepHours" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "showHoursField" BOOLEAN NOT NULL DEFAULT true,
    "showFixedOption" BOOLEAN NOT NULL DEFAULT false,
    "isCooling" BOOLEAN NOT NULL DEFAULT false,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsumerDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "ModelPricing" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "displayName" TEXT,
    "provider" TEXT NOT NULL,
    "inputPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "outputPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModelPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlgorithmSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "dodLifepo4" DOUBLE PRECISION NOT NULL DEFAULT 0.95,
    "dodAgm" DOUBLE PRECISION NOT NULL DEFAULT 0.50,
    "dodGel" DOUBLE PRECISION NOT NULL DEFAULT 0.50,
    "simultaneousLow" DOUBLE PRECISION NOT NULL DEFAULT 0.30,
    "simultaneousModerate" DOUBLE PRECISION NOT NULL DEFAULT 0.50,
    "simultaneousHigh" DOUBLE PRECISION NOT NULL DEFAULT 0.80,
    "alternatorStandard" DOUBLE PRECISION NOT NULL DEFAULT 30.0,
    "alternatorEnhanced" DOUBLE PRECISION NOT NULL DEFAULT 90.0,
    "alternatorEuro6dSmart" DOUBLE PRECISION NOT NULL DEFAULT 30.0,
    "alternatorUnknown" DOUBLE PRECISION NOT NULL DEFAULT 30.0,
    "batteryCompact" DOUBLE PRECISION NOT NULL DEFAULT 80.0,
    "batteryMedium" DOUBLE PRECISION NOT NULL DEFAULT 150.0,
    "batterySpacious" DOUBLE PRECISION NOT NULL DEFAULT 200.0,
    "batterySafetyFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.20,
    "solarSafetyFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.10,
    "standingDaysShort" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "standingDaysMedium" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "standingDaysLong" DOUBLE PRECISION NOT NULL DEFAULT 8.0,
    "maxBackupDays" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "wpPerM2Rigid" DOUBLE PRECISION NOT NULL DEFAULT 235.0,
    "wpPerM2Flexible" DOUBLE PRECISION NOT NULL DEFAULT 180.0,
    "cloudyYieldFactor" DOUBLE PRECISION NOT NULL DEFAULT 0.30,
    "recommendedSolarYieldFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.20,
    "roofUtilizationFactor" DOUBLE PRECISION NOT NULL DEFAULT 0.80,
    "roofOrientationFactor" DOUBLE PRECISION NOT NULL DEFAULT 0.85,
    "portableOrientationFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "sunHoursSummer" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "sunHoursAllYear" DOUBLE PRECISION NOT NULL DEFAULT 3.5,
    "sunHoursWinter" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "locationGermanyAlps" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "locationSouthernEurope" DOUBLE PRECISION NOT NULL DEFAULT 1.2,
    "locationScandinavia" DOUBLE PRECISION NOT NULL DEFAULT 0.6,
    "locationVaries" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "dutyCycleCompressor" DOUBLE PRECISION NOT NULL DEFAULT 0.35,
    "dutyCycleAbsorber" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "inverterClasses" TEXT NOT NULL DEFAULT '500,800,1000,1500,2000,2500,3000,5000',
    "chargerClasses" TEXT NOT NULL DEFAULT '10,20,30,50,60',
    "chargerTimeHoursSlow" DOUBLE PRECISION NOT NULL DEFAULT 12.0,
    "chargerTimeHoursNormal" DOUBLE PRECISION NOT NULL DEFAULT 8.0,
    "chargerTimeHoursFast" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "solarControllerClasses" TEXT NOT NULL DEFAULT '10,20,30,40,50,60,80,100',
    "cableSizes" TEXT NOT NULL DEFAULT '6,10,16,25,35,50,70,95,120',
    "voltageDropCritical" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "voltageDropNormal" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    "voltageDropSolar" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    "copperResistivity" DOUBLE PRECISION NOT NULL DEFAULT 0.0178,
    "minPreselectionScore" INTEGER NOT NULL DEFAULT 30,
    "productSelectionMode" TEXT NOT NULL DEFAULT 'algorithm',
    "reasonGenerationMode" TEXT NOT NULL DEFAULT 'algorithm',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlgorithmSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "showInPreferences" BOOLEAN NOT NULL DEFAULT true,
    "types" TEXT[] DEFAULT ARRAY[]::TEXT[],
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
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_isActive_idx" ON "Product"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "CategoryFilter_categoryId_idx" ON "CategoryFilter"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryFilter_categoryId_key_key" ON "CategoryFilter"("categoryId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "CreditPurchase_paypalOrderId_key" ON "CreditPurchase"("paypalOrderId");

-- CreateIndex
CREATE INDEX "CreditPurchase_resultId_idx" ON "CreditPurchase"("resultId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditBalance_resultId_key" ON "CreditBalance"("resultId");

-- CreateIndex
CREATE INDEX "CreditUsage_resultId_idx" ON "CreditUsage"("resultId");

-- CreateIndex
CREATE UNIQUE INDEX "PromptVersion_version_key" ON "PromptVersion"("version");

-- CreateIndex
CREATE UNIQUE INDEX "ConsumerCategory_slug_key" ON "ConsumerCategory"("slug");

-- CreateIndex
CREATE INDEX "ConsumerDevice_categoryId_idx" ON "ConsumerDevice"("categoryId");

-- CreateIndex
CREATE INDEX "ConsumerDevice_isActive_idx" ON "ConsumerDevice"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ModelPricing_modelId_key" ON "ModelPricing"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandFilterCategory_key_key" ON "BrandFilterCategory"("key");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryFilter" ADD CONSTRAINT "CategoryFilter_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditBalance" ADD CONSTRAINT "CreditBalance_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "Result"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditUsage" ADD CONSTRAINT "CreditUsage_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "Result"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumerDevice" ADD CONSTRAINT "ConsumerDevice_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ConsumerCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
