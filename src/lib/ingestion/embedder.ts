/**
 * Embedding generation with chunking, validation, and idempotency
 */

import { generateEmbedding } from "../gemini";
import { retryWithBackoff } from "../utils/retry";
import { db } from "@/server/db";

const CHUNK_SIZE = 8 * 1024; // 8KB chunks
const CHUNK_OVERLAP = 1024; // 1KB overlap
const EMBEDDING_DIMENSIONS = 768;
const BATCH_SIZE = 10;

export interface CodeChunk {
  fileName: string;
  chunkIndex: number;
  content: string;
  summary: string;
}

/**
 * Chunk large files into smaller pieces with overlap
 */
export function chunkCode(
  fileName: string,
  code: string,
): Array<{ chunkIndex: number; content: string }> {
  if (code.length <= CHUNK_SIZE) {
    return [{ chunkIndex: 0, content: code }];
  }

  const chunks: Array<{ chunkIndex: number; content: string }> = [];
  let start = 0;
  let chunkIndex = 0;

  while (start < code.length) {
    let end = start + CHUNK_SIZE;

    // Try to break at line boundaries
    if (end < code.length) {
      const lastNewline = code.lastIndexOf("\n", end);
      if (lastNewline > start + CHUNK_SIZE / 2) {
        end = lastNewline + 1;
      }
    }

    const content = code.slice(start, end);
    chunks.push({ chunkIndex, content });

    // Move start position with overlap
    start = end - CHUNK_OVERLAP;
    chunkIndex++;
  }

  return chunks;
}

/**
 * Generate embedding for a single chunk with retry and validation
 */
async function generateChunkEmbedding(
  summary: string,
): Promise<number[]> {
  return retryWithBackoff(
    async () => {
      const embedding = await generateEmbedding(summary);

      // Validate embedding dimensions
      if (embedding.length !== EMBEDDING_DIMENSIONS) {
        throw new Error(
          `Invalid embedding dimensions: expected ${EMBEDDING_DIMENSIONS}, got ${embedding.length}`,
        );
      }

      // Validate all values are finite
      for (const value of embedding) {
        if (!Number.isFinite(value)) {
          throw new Error("Invalid embedding: contains non-finite values");
        }
      }

      return embedding;
    },
    {
      maxAttempts: 3,
      onRetry: (attempt, error) => {
        console.log(
          `🔄 Retrying embedding generation (attempt ${attempt}/3):`,
          error.message,
        );
      },
    },
  );
}

/**
 * Store embedding with idempotency check
 */
async function storeEmbedding(
  projectId: string,
  fileName: string,
  chunkIndex: number,
  sourceCode: string,
  summary: string,
  embedding: number[],
): Promise<void> {
  // Check if embedding already exists (idempotency)
  const existing = await db.sourceCodeEmbedding.findUnique({
    where: {
      projectId_fileName_chunkIndex: {
        projectId,
        fileName,
        chunkIndex,
      },
    },
  });

  if (existing) {
    console.log(
      `⏭️ Skipping existing embedding for ${fileName}:${chunkIndex}`,
    );
    return;
  }

  // Create record first (without vector)
  const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
    data: {
      projectId,
      fileName,
      chunkIndex,
      sourceCode,
      summary,
    },
  });

  // Update with vector using raw SQL (Prisma doesn't support vector types directly)
  await db.$executeRaw`
    UPDATE "SourceCodeEmbedding"
    SET "summaryEmbedding" = ${embedding}::vector
    WHERE "id" = ${sourceCodeEmbedding.id}`;
}

/**
 * Process embeddings for code chunks in batches
 */
export async function processEmbeddings(
  projectId: string,
  chunks: CodeChunk[],
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  // Process in batches
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (chunk) => {
        try {
          // Generate embedding
          const embedding = await generateChunkEmbedding(chunk.summary);

          // Store embedding (idempotent)
          await storeEmbedding(
            projectId,
            chunk.fileName,
            chunk.chunkIndex,
            chunk.content,
            chunk.summary,
            embedding,
          );

          return { success: true };
        } catch (error) {
          console.error(
            `❌ Failed to process embedding for ${chunk.fileName}:${chunk.chunkIndex}:`,
            error instanceof Error ? error.message : String(error),
          );
          throw error;
        }
      }),
    );

    // Count results
    for (const result of results) {
      if (result.status === "fulfilled") {
        success++;
      } else {
        failed++;
      }
    }

    console.log(
      `📊 Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}: ${success} success, ${failed} failed`,
    );
  }

  return { success, failed };
}

