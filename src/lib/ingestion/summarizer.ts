/**
 * Summarization module with retry logic and fallback summaries
 */

import { GitHubClient } from "./github-client";
import { retryWithBackoff } from "../utils/retry";
import { aiSummariseCommit, summariseCode as aiSummariseCode } from "../gemini";
import { Document } from "@langchain/core/documents";

const MAX_DIFF_SIZE = 50 * 1024; // 50KB max diff size
const COMMIT_SUMMARY_TIMEOUT = 30000; // 30 seconds
const FILE_SUMMARY_TIMEOUT = 60000; // 60 seconds

/**
 * Truncate text to max length, preserving structure
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "\n\n[... truncated ...]";
}

/**
 * Generate fallback summary for commit
 */
function generateCommitFallback(
  commitMessage: string,
  diff?: string,
): string {
  const firstLine = commitMessage.split("\n")[0] ?? commitMessage;
  let summary = firstLine;

  if (diff) {
    // Count files changed
    const fileMatches = diff.match(/^diff --git/gm);
    const fileCount = fileMatches ? fileMatches.length : 0;
    if (fileCount > 0) {
      summary += ` (${fileCount} file${fileCount > 1 ? "s" : ""} changed)`;
    }
  }

  return summary;
}

/**
 * Generate fallback summary for code file
 */
function generateCodeFallback(
  fileName: string,
  code: string,
): string {
  const lines = code.split("\n");
  const lineCount = lines.length;

  // Try to extract function/class names
  const functions = code.match(/(?:function|const|let|var)\s+(\w+)/g) || [];
  const classes = code.match(/class\s+(\w+)/g) || [];

  let summary = `File: ${fileName} (${lineCount} lines)`;

  if (functions.length > 0 || classes.length > 0) {
    const items = [
      ...classes.slice(0, 3),
      ...functions.slice(0, 3),
    ].map((item) => item.split(/\s+/).pop());
    summary += `. Contains: ${items.join(", ")}`;
  }

  return summary;
}

/**
 * Summarize commit with retry and fallback
 */
export async function summariseCommit(
  githubUrl: string,
  commitHash: string,
  githubToken?: string,
): Promise<string> {
  try {
    const { owner, repo } = parseGithubUrl(githubUrl);
    const client = new GitHubClient({ token: githubToken });

    // Get commit diff with timeout
    const diffPromise = client.getCommitDiff(owner, repo, commitHash);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), COMMIT_SUMMARY_TIMEOUT),
    );

    let diff: string;
    try {
      diff = await Promise.race([diffPromise, timeoutPromise]);
    } catch (error) {
      console.warn(
        `⚠️ Timeout or error fetching diff for ${commitHash}, using fallback`,
      );
      // Get commit message for fallback - fetch more commits to find the right one
      const commits = await client.getAllCommits(owner, repo, 100);
      const commit = commits.find((c) => c.commitHash === commitHash);
      return generateCommitFallback(
        commit?.commitMessage || `Commit ${commitHash.slice(0, 7)}`,
        undefined,
      );
    }

    // Validate and truncate diff
    if (!diff || diff.trim().length === 0) {
      const commits = await client.getAllCommits(owner, repo, 100);
      const commit = commits.find((c) => c.commitHash === commitHash);
      return generateCommitFallback(
        commit?.commitMessage || `Commit ${commitHash.slice(0, 7)}`,
        undefined,
      );
    }

    const truncatedDiff =
      diff.length > MAX_DIFF_SIZE
        ? truncateText(diff, MAX_DIFF_SIZE)
        : diff;

    // Try to get AI summary with retry
    const summary = await retryWithBackoff(
      async () => {
        return await aiSummariseCommit(truncatedDiff);
      },
      {
        maxAttempts: 3,
        onRetry: (attempt, error) => {
          console.log(
            `🔄 Retrying commit summary for ${commitHash} (attempt ${attempt}/3):`,
            error.message,
          );
        },
      },
    );

    // Validate summary
    if (!summary || summary.trim().length === 0) {
      console.warn(
        `⚠️ Empty summary for ${commitHash}, using fallback`,
      );
      return generateCommitFallback(
        truncatedDiff.match(/^Subject: (.+)$/m)?.[1] || "Commit",
        truncatedDiff,
      );
    }

    return summary.trim();
  } catch (error) {
    console.error(
      `❌ Failed to summarize commit ${commitHash} after retries:`,
      error instanceof Error ? error.message : String(error),
    );

    // Always return fallback, never empty
    try {
      const { owner, repo } = parseGithubUrl(githubUrl);
      const client = new GitHubClient({ token: githubToken });
      const commits = await client.getAllCommits(owner, repo, 100);
      const commit = commits.find((c) => c.commitHash === commitHash);
      return generateCommitFallback(
        commit?.commitMessage || `Commit ${commitHash.slice(0, 7)}`,
        undefined,
      );
    } catch {
      return `Commit: ${commitHash.slice(0, 7)}`;
    }
  }
}

/**
 * Summarize code file with retry and fallback
 */
export async function summariseCode(
  fileName: string,
  code: string,
): Promise<string> {
  try {
    // Validate input
    if (!code || code.trim().length === 0) {
      return generateCodeFallback(fileName, "");
    }

    // Truncate if too large
    const truncatedCode =
      code.length > 10000 ? truncateText(code, 10000) : code;

    // Try to get AI summary with retry and timeout
    const doc = new Document({
      pageContent: truncatedCode,
      metadata: { source: fileName },
    });

    const summaryPromise = retryWithBackoff(
      async () => {
        // Get unique summary for this file
        const uniqueSummary = await aiSummariseCode(doc);
        
        // Validate it's not a generic/cached response
        // Check if summary mentions react-dom but file doesn't
        if (
          uniqueSummary.toLowerCase().includes("react-dom.development") &&
          !fileName.toLowerCase().includes("react-dom")
        ) {
          console.warn(
            `⚠️ Suspicious generic summary detected for ${fileName}, retrying...`,
          );
          throw new Error("Generic summary detected, retrying");
        }
        
        // Validate summary is meaningful (not too short)
        if (uniqueSummary.trim().length < 20) {
          throw new Error("Summary too short, likely invalid");
        }
        
        return uniqueSummary;
      },
      {
        maxAttempts: 3,
        onRetry: (attempt, error) => {
          console.log(
            `🔄 Retrying code summary for ${fileName} (attempt ${attempt}/3):`,
            error.message,
          );
        },
      },
    );

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), FILE_SUMMARY_TIMEOUT),
    );

    const summary = await Promise.race([summaryPromise, timeoutPromise]);

    // Validate summary
    if (!summary || summary.trim().length === 0) {
      console.warn(`⚠️ Empty summary for ${fileName}, using fallback`);
      return generateCodeFallback(fileName, truncatedCode);
    }

    return summary.trim();
  } catch (error) {
    console.error(
      `❌ Failed to summarize code for ${fileName} after retries:`,
      error instanceof Error ? error.message : String(error),
    );
    // Always return fallback
    return generateCodeFallback(fileName, code);
  }
}

/**
 * Parse GitHub URL helper
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


