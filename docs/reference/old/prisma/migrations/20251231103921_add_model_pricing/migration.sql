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

-- CreateIndex
CREATE UNIQUE INDEX "ModelPricing_modelId_key" ON "ModelPricing"("modelId");
