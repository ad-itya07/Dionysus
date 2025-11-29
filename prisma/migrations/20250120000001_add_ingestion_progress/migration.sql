-- Add progress tracking fields to Project
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "ingestionProgress" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "ingestionFilesTotal" INTEGER;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "ingestionFilesProcessed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "ingestionCommitsTotal" INTEGER;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "ingestionCommitsProcessed" INTEGER NOT NULL DEFAULT 0;

-- Add READY status to IngestionStatus enum
DO $$ BEGIN
  ALTER TYPE "IngestionStatus" ADD VALUE IF NOT EXISTS 'READY';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

