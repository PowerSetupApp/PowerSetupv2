-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "filterValues" JSONB;

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

-- CreateIndex
CREATE INDEX "CategoryFilter_categoryId_idx" ON "CategoryFilter"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryFilter_categoryId_key_key" ON "CategoryFilter"("categoryId", "key");

-- AddForeignKey
ALTER TABLE "CategoryFilter" ADD CONSTRAINT "CategoryFilter_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
