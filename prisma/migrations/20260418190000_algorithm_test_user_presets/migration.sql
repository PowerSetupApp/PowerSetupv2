-- Algorithmus-Test: Admin-Presets (realistische Szenarien), getrennt von Zufalls-Filtern
CREATE TABLE IF NOT EXISTS "AlgorithmTestUserPreset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "formData" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlgorithmTestUserPreset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AlgorithmTestUserPreset_isActive_sortOrder_idx" ON "AlgorithmTestUserPreset"("isActive", "sortOrder");
