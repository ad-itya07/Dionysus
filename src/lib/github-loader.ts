/**
 * GitHub repository loader with improved error handling and pagination
 */

import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { Document } from "@langchain/core/documents";
import { GitHubClient } from "./ingestion/github-client";

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
 * Check credits by counting files in repository
 */
export async function checkCredits(
  githubUrl: string,
  githubToken?: string,
): Promise<number> {
  const { owner, repo } = parseGithubUrl(githubUrl);
  const client = new GitHubClient({ token: githubToken });
  return client.getFileCount(owner, repo);
}

/**
 * Load GitHub repository files
 */
export async function loadGithubRepo(
  githubUrl: string,
  githubToken?: string,
): Promise<Document[]> {
  const { owner, repo } = parseGithubUrl(githubUrl);
  const client = new GitHubClient({ token: githubToken });

  const branch = await client.getDefaultBranch(owner, repo);

  const loader = new GithubRepoLoader(githubUrl, {
    accessToken: githubToken || "",
    branch: branch,
    ignoreFiles: [
      "package-lock.json",
      "yarn.lock",
      "pnpm-lock.yaml",
      "bun.lockb",
      "*.lock",
      "*.log",
      "node_modules/**",
      ".git/**",
      ".next/**",
      "dist/**",
      "build/**",
    ],
    recursive: true,
    unknown: "warn",
    maxConcurrency: 5,
  });

  try {
    const docs = await loader.load();
    return docs;
  } catch (error) {
    console.error("Error loading GitHub repo:", error);
    throw new Error(
      `Failed to load repository: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
