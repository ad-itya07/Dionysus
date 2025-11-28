/**
 * Robust GitHub API client with pagination, rate limit handling, and retries
 */

import { Octokit } from "octokit";
import { retryWithBackoff, sleep } from "../utils/retry";
import { env } from "@/env";

export interface GitHubClientOptions {
  token?: string;
}

export class GitHubClient {
  private octokit: Octokit;
  private token: string | undefined;

  constructor(options: GitHubClientOptions = {}) {
    // Use user-provided token if available, otherwise fall back to env token
    this.token = options.token || env.GITHUB_TOKEN;
    this.octokit = new Octokit({
      auth: this.token,
    });
  }

  /**
   * Handle rate limits by waiting until reset time
   */
  private async handleRateLimit(response: any): Promise<void> {
    const remaining = response.headers["x-ratelimit-remaining"];
    const reset = response.headers["x-ratelimit-reset"];

    if (remaining === "0" && reset) {
      const resetTime = parseInt(reset, 10) * 1000; // Convert to milliseconds
      const now = Date.now();
      const waitTime = Math.max(0, resetTime - now) + 1000; // Add 1s buffer

      if (waitTime > 0) {
        console.log(
          `⏳ Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)}s until reset...`,
        );
        await sleep(waitTime);
      }
    }
  }

  /**
   * Get all commits with pagination
   */
  async getAllCommits(
    owner: string,
    repo: string,
    maxCommits?: number,
  ): Promise<
    Array<{
      commitHash: string;
      commitMessage: string;
      commitAuthorName: string;
      commitAuthorAvatar: string;
      commitDate: string;
    }>
  > {
    return retryWithBackoff(
      async () => {
        const commits: any[] = [];

        // Use paginate to get all commits
        for await (const response of this.octokit.paginate.iterator(
          this.octokit.rest.repos.listCommits,
          {
            owner,
            repo,
            per_page: 100, // Max per page
          },
        )) {
          await this.handleRateLimit(response);

          commits.push(...response.data);

          // Stop if we've reached the max
          if (maxCommits && commits.length >= maxCommits) {
            break;
          }
        }

        // Sort by date (newest first)
        const sortedCommits = commits.sort(
          (a, b) =>
            new Date(b.commit.author.date).getTime() -
            new Date(a.commit.author.date).getTime(),
        );

        // Limit to maxCommits if specified
        const limitedCommits = maxCommits
          ? sortedCommits.slice(0, maxCommits)
          : sortedCommits;

        return limitedCommits.map((commit) => ({
          commitHash: commit.sha,
          commitMessage: commit.commit.message ?? "",
          commitAuthorName: commit.commit?.author?.name ?? "",
          commitAuthorAvatar: commit.author?.avatar_url ?? "",
          commitDate: commit.commit?.author?.date ?? "",
        }));
      },
      {
        maxAttempts: 3,
        onRetry: (attempt, error) => {
          console.log(
            `🔄 Retrying getAllCommits (attempt ${attempt}/3):`,
            error.message,
          );
        },
      },
    );
  }

  /**
   * Get file count with pagination support
   */
  async getFileCount(
    owner: string,
    repo: string,
    path: string = "",
  ): Promise<number> {
    return retryWithBackoff(
      async () => {
        let fileCount = 0;
        const directories: string[] = [];

        // Get content with pagination
        const response = await this.octokit.rest.repos.getContent({
          owner,
          repo,
          path,
        });

        await this.handleRateLimit(response);

        // Handle paginated responses
        const items = Array.isArray(response.data) ? response.data : [response.data];

        for (const item of items) {
          if (item.type === "file") {
            fileCount++;
          } else if (item.type === "dir") {
            directories.push(item.path);
          }
        }

        // Recursively count files in subdirectories
        if (directories.length > 0) {
          const directoryCounts = await Promise.all(
            directories.map((dirPath) =>
              this.getFileCount(owner, repo, dirPath),
            ),
          );
          fileCount += directoryCounts.reduce((acc, count) => acc + count, 0);
        }

        return fileCount;
      },
      {
        maxAttempts: 3,
        onRetry: (attempt, error) => {
          console.log(
            `🔄 Retrying getFileCount for ${path} (attempt ${attempt}/3):`,
            error.message,
          );
        },
      },
    );
  }

  /**
   * Get default branch
   */
  async getDefaultBranch(owner: string, repo: string): Promise<string> {
    return retryWithBackoff(
      async () => {
        const response = await this.octokit.rest.repos.get({
          owner,
          repo,
        });
        await this.handleRateLimit(response);
        return response.data.default_branch;
      },
      {
        maxAttempts: 3,
        onRetry: (attempt, error) => {
          console.log(
            `🔄 Retrying getDefaultBranch (attempt ${attempt}/3):`,
            error.message,
          );
        },
      },
    );
  }

  /**
   * Get commit diff
   */
  async getCommitDiff(
    owner: string,
    repo: string,
    commitHash: string,
  ): Promise<string> {
    return retryWithBackoff(
      async () => {
        // Use raw diff URL (Octokit doesn't have a direct diff endpoint)
        const axios = (await import("axios")).default;
        const githubUrl = `https://github.com/${owner}/${repo}`;
        const response = await axios.get(
          `${githubUrl}/commit/${commitHash}.diff`,
          {
            headers: {
              Accept: "application/vnd.github.v3.diff",
              ...(this.token ? { Authorization: `token ${this.token}` } : {}),
            },
          },
        );
        return response.data;
      },
      {
        maxAttempts: 3,
        onRetry: (attempt, error) => {
          console.log(
            `🔄 Retrying getCommitDiff for ${commitHash} (attempt ${attempt}/3):`,
            error.message,
          );
        },
      },
    );
  }

  /**
   * Validate repository access
   */
  async validateRepo(owner: string, repo: string): Promise<boolean> {
    try {
      await retryWithBackoff(
        async () => {
          const response = await this.octokit.rest.repos.get({
            owner,
            repo,
          });
          await this.handleRateLimit(response);
          return response.data;
        },
        {
          maxAttempts: 2,
        },
      );
      return true;
    } catch (error) {
      console.error(`❌ Failed to validate repo ${owner}/${repo}:`, error);
      return false;
    }
  }
}

