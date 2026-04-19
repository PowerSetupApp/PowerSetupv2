-- Migration: rename pdfUrl → schematicImageUrl, remove deprecated Brand.type
-- Run manually: psql $DATABASE_URL < prisma/migrations/manual/rename_pdfurl_remove_brand_type.sql

-- 1. Rename pdfUrl to schematicImageUrl on Result table
ALTER TABLE "Result" RENAME COLUMN "pdfUrl" TO "schematicImageUrl";

-- 2. Remove deprecated type field from Brand table
--    First migrate any existing data: populate types[] from type if not already done
UPDATE "Brand"
SET types = ARRAY[type]
WHERE type IS NOT NULL
  AND (types IS NULL OR array_length(types, 1) IS NULL OR array_length(types, 1) = 0);

ALTER TABLE "Brand" DROP COLUMN IF EXISTS "type";
