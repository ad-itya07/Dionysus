/**
 * Ingestion orchestrator with status tracking, transactions, and error recovery
 */

import { db } from "@/server/db";
import { loadGithubRepo } from "../github-loader";
import { summariseCode } from "./summarizer";
import { chunkCode, processEmbeddings, CodeChunk } from "./embedder";
import { pollCommits } from "../github";
import { Document } from "@langchain/core/documents";
import { IngestionStatus } from "@prisma/client";

export interface IngestionOptions {
  githubToken?: string;
  maxCommits?: number;
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
 * Main ingestion orchestrator
 */
export async function ingestRepository(
  projectId: string,
  githubUrl: string,
  options: IngestionOptions = {},
): Promise<void> {
  const { githubToken, maxCommits = 100 } = options;

  console.log(`🚀 Starting ingestion for project ${projectId}...`);

  // Update status to IN_PROGRESS
  await db.project.update({
    where: { id: projectId },
    data: {
      ingestionStatus: IngestionStatus.IN_PROGRESS,
      ingestionStartedAt: new Date(),
      ingestionErrorMessage: null,
    },
  });

  try {
    // Stage 1: Validate repository
    console.log(`📋 Stage 1: Validating repository...`);
    await validateRepo(githubUrl, githubToken);

    // Stage 2: Fetch files
    console.log(`📁 Stage 2: Fetching repository files...`);
    const docs = await loadGithubRepo(githubUrl, githubToken);
    console.log(`✅ Loaded ${docs.length} files`);

    // Stage 3: Generate summaries
    console.log(`📝 Stage 3: Generating summaries...`);
    const docsWithSummaries = await Promise.allSettled(
      docs.map(async (doc) => {
        try {
          const fileName = doc.metadata.source as string;
          const code = doc.pageContent;
          const summary = await summariseCode(fileName, code);
          return { doc, summary };
        } catch (error) {
          console.error(
            `⚠️ Failed to summarize ${doc.metadata.source}:`,
            error,
          );
          // Return with fallback summary
          return {
            doc,
            summary: `File: ${doc.metadata.source} (${doc.pageContent.split("\n").length} lines)`,
          };
        }
      }),
    );

    // Stage 4: Chunk and prepare embeddings
    console.log(`🔪 Stage 4: Chunking files...`);
    const chunks: CodeChunk[] = [];
    for (const result of docsWithSummaries) {
      if (result.status === "fulfilled") {
        const { doc, summary } = result.value;
        const fileChunks = chunkCode(
          doc.metadata.source as string,
          doc.pageContent,
        );

        for (const chunk of fileChunks) {
          chunks.push({
            fileName: doc.metadata.source as string,
            chunkIndex: chunk.chunkIndex,
            content: chunk.content,
            summary: summary,
          });
        }
      }
    }
    console.log(`✅ Created ${chunks.length} chunks from ${docs.length} files`);

    // Stage 5: Generate and store embeddings
    console.log(`🧮 Stage 5: Generating embeddings...`);
    const embeddingResults = await processEmbeddings(projectId, chunks);
    console.log(
      `✅ Processed embeddings: ${embeddingResults.success} success, ${embeddingResults.failed} failed`,
    );

    // Stage 6: Fetch and process commits
    console.log(`📜 Stage 6: Processing commits...`);
    const commitResult = await pollCommits(projectId, githubToken);
    console.log(`✅ Processed ${commitResult.count} commits`);

    // Stage 7: Mark as completed
    console.log(`✅ Stage 7: Marking ingestion as completed...`);
    await db.project.update({
      where: { id: projectId },
      data: {
        ingestionStatus: IngestionStatus.COMPLETED,
        ingestionCompletedAt: new Date(),
        ingestionErrorMessage: null,
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

