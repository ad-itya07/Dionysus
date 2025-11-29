/**
 * Simplified ingestion orchestrator with status tracking
 */

import { db } from "@/server/db";
import { loadGithubRepo } from "../github-loader";
import { summariseCode } from "./summarizer";
import { chunkCode, CodeChunk } from "./embedder";
import { pollCommits } from "../github";
import { Document } from "@langchain/core/documents";
import { IngestionStatus } from "@prisma/client";

export interface IngestionOptions {
  githubToken?: string;
  maxCommits?: number;
  maxCommitsToSummarize?: number;
}

/**
 * Store files without generating embeddings (cost optimization)
 */
async function storeFilesWithoutEmbeddings(
  projectId: string,
  chunks: CodeChunk[],
): Promise<void> {
  // Store files in SourceCodeEmbedding table without embeddings
  // This allows on-demand text search while saving embedding generation costs
  for (const chunk of chunks) {
    // Check if already exists (idempotency)
    const existing = await db.sourceCodeEmbedding.findUnique({
      where: {
        projectId_fileName_chunkIndex: {
          projectId,
          fileName: chunk.fileName,
          chunkIndex: chunk.chunkIndex,
        },
      },
    });

    if (!existing) {
      await db.sourceCodeEmbedding.create({
        data: {
          projectId,
          fileName: chunk.fileName,
          chunkIndex: chunk.chunkIndex,
          sourceCode: chunk.content,
          summary: chunk.summary,
          // summaryEmbedding is left as null (no embedding generated)
        },
      });
    }
  }
  console.log(`✅ Stored ${chunks.length} file chunks for on-demand search`);
}

/**
 * Update ingestion progress
 */
async function updateProgress(
  projectId: string,
  progress: number,
  filesProcessed?: number,
  filesTotal?: number,
  commitsProcessed?: number,
  commitsTotal?: number,
) {
  await db.project.update({
    where: { id: projectId },
    data: {
      ingestionProgress: Math.min(100, Math.max(0, progress)),
      ...(filesProcessed !== undefined && { ingestionFilesProcessed: filesProcessed }),
      ...(filesTotal !== undefined && { ingestionFilesTotal: filesTotal }),
      ...(commitsProcessed !== undefined && { ingestionCommitsProcessed: commitsProcessed }),
      ...(commitsTotal !== undefined && { ingestionCommitsTotal: commitsTotal }),
    },
  });
}

/**
 * Validate repository access
 */
async function validateRepo(
  githubUrl: string,
  githubToken?: string,
): Promise<void> {
  const { GitHubClient } = await import("./github-client");
  const client = new GitHubClient({ token: githubToken });
  const { owner, repo } = parseGithubUrl(githubUrl);

  const isValid = await client.validateRepo(owner, repo);
  if (!isValid) {
    throw new Error(`Cannot access repository: ${githubUrl}`);
  }
}

/**
 * Parse GitHub URL
 */
function parseGithubUrl(githubUrl: string): { owner: string; repo: string } {
  const parts = githubUrl.split("/").filter(Boolean);
  const repoIndex = parts.indexOf("github.com");
  if (repoIndex === -1 || parts.length < repoIndex + 3) {
    throw new Error("Invalid GitHub URL format");
  }
  const owner = parts[repoIndex + 1];
  const repo = parts[repoIndex + 2]?.replace(/\.git$/, "");
  if (!owner || !repo) {
    throw new Error("Invalid GitHub URL: missing owner or repo");
  }
  return { owner, repo };
}

/**
 * Main ingestion orchestrator - simplified version
 */
export async function ingestRepository(
  projectId: string,
  githubUrl: string,
  options: IngestionOptions = {},
): Promise<void> {
  const { githubToken, maxCommits = 100, maxCommitsToSummarize = 8 } = options;

  console.log(`🚀 Starting ingestion for project ${projectId}...`);

  // Update status to IN_PROGRESS
  await db.project.update({
    where: { id: projectId },
    data: {
      ingestionStatus: IngestionStatus.IN_PROGRESS,
      ingestionStartedAt: new Date(),
      ingestionErrorMessage: null,
      ingestionProgress: 0,
      ingestionFilesProcessed: 0,
      ingestionCommitsProcessed: 0,
    },
  });

  try {
    // Stage 1: Validate repository (10%)
    console.log(`📋 Stage 1: Validating repository...`);
    await validateRepo(githubUrl, githubToken);
    await updateProgress(projectId, 10);

    // Stage 2: Fetch files (20%)
    console.log(`📁 Stage 2: Fetching repository files...`);
    const allDocs = await loadGithubRepo(githubUrl, githubToken);
    console.log(`✅ Loaded ${allDocs.length} files`);
    await updateProgress(projectId, 20, 0, allDocs.length);

    // Stage 3: Generate summaries for all files (20-60%)
    console.log(`📝 Stage 3: Generating summaries for ${allDocs.length} files...`);
    const chunks: CodeChunk[] = [];
    let processed = 0;

    for (let i = 0; i < allDocs.length; i++) {
      const doc = allDocs[i];
      if (!doc) continue;

      try {
        const fileName = doc.metadata.source as string;
        const code = doc.pageContent;

        // Add delay to avoid rate limiting (every 10 files)
        if (i > 0 && i % 10 === 0) {
          console.log(`⏸️ Rate limiting pause at file ${i + 1}/${allDocs.length}...`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        const summary = await summariseCode(fileName, code);

        // Validate summary
        if (!summary || summary.trim().length < 10) {
          throw new Error("Summary too short or empty");
        }

        // Chunk the file
        const fileChunks = chunkCode(fileName, code);
        for (const chunk of fileChunks) {
          chunks.push({
            fileName,
            chunkIndex: chunk.chunkIndex,
            content: chunk.content,
            summary: summary,
          });
        }

        processed++;
        const progress = 20 + Math.floor((processed / allDocs.length) * 40);
        await updateProgress(projectId, progress, processed, allDocs.length);
      } catch (error) {
        console.error(
          `⚠️ Failed to summarize ${doc.metadata.source}:`,
          error instanceof Error ? error.message : String(error),
        );
        // Continue with fallback summary
        const fileName = doc.metadata.source as string;
        const fileChunks = chunkCode(fileName, doc.pageContent);
        for (const chunk of fileChunks) {
          chunks.push({
            fileName,
            chunkIndex: chunk.chunkIndex,
            content: chunk.content,
            summary: `File: ${fileName} (${doc.pageContent.split("\n").length} lines)`,
          });
        }
        processed++;
      }
    }

    console.log(`✅ Generated ${chunks.length} chunks from ${processed} files`);

    // Stage 4: Store files without embeddings (60-80%)
    // Skip embedding generation to save costs - we'll use text search instead
    console.log(`💾 Stage 4: Storing files for on-demand search...`);
    await storeFilesWithoutEmbeddings(projectId, chunks);
    await updateProgress(projectId, 80, processed, allDocs.length);

    // Stage 5: Fetch and process commits (80-95%)
    console.log(`📜 Stage 5: Processing commits...`);
    const commitResult = await pollCommits(
      projectId,
      githubToken,
      maxCommitsToSummarize,
    );
    console.log(
      `✅ Processed ${commitResult.count} commits (${commitResult.summarized} with AI summaries)`,
    );
    await updateProgress(
      projectId,
      95,
      processed,
      allDocs.length,
      commitResult.count,
      commitResult.count,
    );

    // Stage 6: Mark as completed (100%)
    console.log(`✅ Stage 6: Marking ingestion as completed...`);
    await db.project.update({
      where: { id: projectId },
      data: {
        ingestionStatus: IngestionStatus.COMPLETED,
        ingestionCompletedAt: new Date(),
        ingestionErrorMessage: null,
        ingestionProgress: 100,
      },
    });

    console.log(`🎉 Ingestion completed successfully for project ${projectId}`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    console.error(`❌ Ingestion failed for project ${projectId}:`, errorMessage);

    // Mark as failed with error message
    await db.project.update({
      where: { id: projectId },
      data: {
        ingestionStatus: IngestionStatus.FAILED,
        ingestionCompletedAt: new Date(),
        ingestionErrorMessage: errorMessage,
      },
    });

    throw error;
  }
}

/**
 * Check if ingestion can be resumed
 */
export async function canResumeIngestion(projectId: string): Promise<boolean> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { ingestionStatus: true },
  });

  return (
    project?.ingestionStatus === IngestionStatus.FAILED ||
    project?.ingestionStatus === IngestionStatus.IN_PROGRESS
  );
}
