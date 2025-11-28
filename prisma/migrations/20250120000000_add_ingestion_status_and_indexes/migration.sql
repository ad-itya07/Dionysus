-- CreateEnum: IngestionStatus enum (must be created before using it)
DO $$ BEGIN
 CREATE TYPE "IngestionStatus" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- AlterTable: Add ingestion status fields to Project
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "ingestionStatus" "IngestionStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "ingestionStartedAt" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "ingestionCompletedAt" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "ingestionErrorMessage" TEXT;

-- AlterTable: Add chunkIndex to SourceCodeEmbedding
ALTER TABLE "SourceCodeEmbedding" ADD COLUMN IF NOT EXISTS "chunkIndex" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex: Add indexes for Commit
CREATE INDEX IF NOT EXISTS "Commit_commitHash_idx" ON "Commit"("commitHash");
CREATE INDEX IF NOT EXISTS "Commit_projectId_idx" ON "Commit"("projectId");

-- CreateIndex: Add indexes for SourceCodeEmbedding
CREATE INDEX IF NOT EXISTS "SourceCodeEmbedding_projectId_idx" ON "SourceCodeEmbedding"("projectId");
CREATE INDEX IF NOT EXISTS "SourceCodeEmbedding_fileName_idx" ON "SourceCodeEmbedding"("fileName");

-- CreateUniqueConstraint: Add unique constraint on Commit(projectId, commitHash)
DO $$ BEGIN
 ALTER TABLE "Commit" ADD CONSTRAINT "Commit_projectId_commitHash_key" UNIQUE ("projectId", "commitHash");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateUniqueConstraint: Add unique constraint on SourceCodeEmbedding(projectId, fileName, chunkIndex)
DO $$ BEGIN
 ALTER TABLE "SourceCodeEmbedding" ADD CONSTRAINT "SourceCodeEmbedding_projectId_fileName_chunkIndex_key" UNIQUE ("projectId", "fileName", "chunkIndex");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

