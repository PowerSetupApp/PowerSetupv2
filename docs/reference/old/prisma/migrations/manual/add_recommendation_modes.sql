-- Safe migration: Add recommendation engine fields
-- This ONLY adds new columns, no data is deleted

ALTER TABLE "AlgorithmSettings" 
ADD COLUMN IF NOT EXISTS "productSelectionMode" TEXT DEFAULT 'algorithm';

ALTER TABLE "AlgorithmSettings" 
ADD COLUMN IF NOT EXISTS "reasonGenerationMode" TEXT DEFAULT 'algorithm';
