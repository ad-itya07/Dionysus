/**
 * GitHub commit fetching and processing with pagination, retries, and proper error handling
 */

import { db } from "@/server/db";
import { GitHubClient } from "./ingestion/github-client";
import { summariseCommit } from "./ingestion/summarizer";
import pLimit from "p-limit";

const limit = pLimit(10); // Limit concurrent requests

type CommitResponse = {
  commitHash: string;
  commitMessage: string;
  commitAuthorName: string;
  commitAuthorAvatar: string;
  commitDate: string;
};

/**
 * Parse GitHub URL to extract owner and repo
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
 * Get all commits with pagination support
 */
export async function getCommitHashes(
  githubUrl: string,
  githubToken?: string,
  maxCommits?: number,
): Promise<CommitResponse[]> {
  const { owner, repo } = parseGithubUrl(githubUrl);
  const client = new GitHubClient({ token: githubToken });
  return client.getAllCommits(owner, repo, maxCommits);
}

/**
 * Poll and process commits for a project
 */
export async function pollCommits(
  projectId: string,
  githubToken?: string,
): Promise<{ count: number }> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { githubUrl: true },
  });

  if (!project?.githubUrl) {
    throw new Error("Project has no GitHub URL");
  }

  console.log(`📥 Fetching commits for project ${projectId}...`);

  // Get all commits with pagination (process up to 100 at a time)
  const allCommits = await getCommitHashes(project.githubUrl, githubToken, 100);

  // Filter out already processed commits
  const unprocessedCommits = await filterUnprocessedCommits(
    projectId,
    allCommits,
  );

  if (unprocessedCommits.length === 0) {
    console.log(`✅ No new commits to process for project ${projectId}`);
    return { count: 0 };
  }

  console.log(
    `📝 Processing ${unprocessedCommits.length} new commits...`,
  );

  // Process commits with summaries (with concurrency limit)
  const commitsWithSummaries = await Promise.all(
    unprocessedCommits.map((commit) =>
      limit(async () => {
        try {
          const summary = await summariseCommit(
            project.githubUrl,
            commit.commitHash,
            githubToken,
          );
          return { ...commit, summary };
        } catch (err) {
          console.error(
            `❌ Failed to summarize commit ${commit.commitHash}:`,
            err instanceof Error ? err.message : String(err),
          );
          // Return with fallback summary instead of empty
          return {
            ...commit,
            summary: `Commit: ${commit.commitMessage.split("\n")[0]}`,
          };
        }
      }),
    ),
  );

  // Insert commits (using createMany with skipDuplicates)
  const result = await db.commit.createMany({
    data: commitsWithSummaries.map((commit) => ({
      projectId: projectId,
      commitHash: commit.commitHash,
      commitMessage: commit.commitMessage,
      commitAuthorName: commit.commitAuthorName,
      commitAuthorAvatar: commit.commitAuthorAvatar,
      commitDate: new Date(commit.commitDate),
      summary: commit.summary,
    })),
    skipDuplicates: true, // Skip if commit already exists (idempotency)
  });

  console.log(
    `✅ Successfully processed ${result.count} commits for project ${projectId}`,
  );

  return { count: result.count };
}

/**
 * Filter out commits that have already been processed
 */
async function filterUnprocessedCommits(
  projectId: string,
  commitHashes: CommitResponse[],
): Promise<CommitResponse[]> {
  const processedCommits = await db.commit.findMany({
    where: { projectId },
    select: { commitHash: true },
  });

  const processedHashes = new Set(processedCommits.map((c) => c.commitHash));

  return commitHashes.filter(
    (commit) => !processedHashes.has(commit.commitHash),
  );
}
