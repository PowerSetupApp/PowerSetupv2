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
    "showFixedOption" BOOLEAN NOT NULL DEFAULT true,
    "isCooling" BOOLEAN NOT NULL DEFAULT false,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsumerDevice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConsumerCategory_slug_key" ON "ConsumerCategory"("slug");

-- CreateIndex
CREATE INDEX "ConsumerDevice_categoryId_idx" ON "ConsumerDevice"("categoryId");

-- CreateIndex
CREATE INDEX "ConsumerDevice_isActive_idx" ON "ConsumerDevice"("isActive");

-- AddForeignKey
ALTER TABLE "ConsumerDevice" ADD CONSTRAINT "ConsumerDevice_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ConsumerCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
