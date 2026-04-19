-- Idempotent repair: legacy DBs (pre-202604 migration baseline) lack this column.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'AlgorithmSettings'
      AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE "AlgorithmSettings"
      ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;
