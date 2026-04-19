-- CreateEnum
CREATE TYPE "SchematicVariant" AS ENUM ('beginner', 'professional');

-- AlterTable
ALTER TABLE "Result" ADD COLUMN "schematicVariant" "SchematicVariant" NOT NULL DEFAULT 'professional';
