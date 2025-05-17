// bun run src/lib/github.ts
// npx tsx src/lib/github.ts

import { db } from "@/server/db";
import { Octokit } from "octokit";
import axios from "axios";
import { aiSummariseCommit } from "./gemini";
import pLimit from "p-limit";

const limit = pLimit(10); // Limit to 2 concurrent requests

export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

type Response = {
  commitHash: string;
  commitMessage: string;
  commitAuthorName: string;
  commitAuthorAvatar: string;
  commitDate: string;
};

export const getCommitHashes = async (
  githubUrl: string,
): Promise<Response[]> => {
  const [owner, repo] = githubUrl.split("/").slice(-2);
  if (!owner || !repo) {
    throw new Error("Invalid GitHub URL");
  }
  const { data } = await octokit.rest.repos.listCommits({
    owner,
    repo,
  });

  const sortedCommits = data.sort(
    (a: any, b: any) =>
      new Date(b.commit.author.date).getTime() -
      new Date(a.commit.author.date).getTime(),
  ) as any[];
  return sortedCommits.slice(0, 10).map((commit: any) => ({
    commitHash: commit.sha as string,
    commitMessage: commit.commit.message ?? "",
    commitAuthorName: commit.commit?.author?.name ?? "",
    commitAuthorAvatar: commit.author?.avatar_url ?? "",
    commitDate: commit.commit?.author?.date ?? "",
  }));
};

export const pollCommits = async (projectId: string) => {
  const { project, githubUrl } = await fetchProjectGithubUrl(projectId);
  const commitHashes = await getCommitHashes(githubUrl);
  const unprocessedCommits = await (
    await filterUnprocessedCommits(projectId, commitHashes)
  ).slice(0, 10);
  // const summaryResponses = await Promise.allSettled(
  //   unprocessedCommits.map((commit) => {
  //     return summariseCommit(githubUrl, commit.commitHash);
  //   }),
  // );
  // const summaries = summaryResponses.map((response) => {
  //   if (response.status === "fulfilled") {
  //     return response.value as string;
  //   }
  //   return "";
  // });

  const commitsWithSummaries = await Promise.all(
    unprocessedCommits.map((commit) =>
      limit(async () => {
        try {
          const summary = await summariseCommit(githubUrl, commit.commitHash);
          return { ...commit, summary };
        } catch (err) {
          console.error(`❌ Failed to summarize ${commit.commitHash}`, err);
          return { ...commit, summary: "" };
        }
      }),
    ),
  );

  const commits = await db.commit.createMany({
    data: commitsWithSummaries.map((commit, index) => {
      console.log(`processing commit ${index + 1}: ${commit.commitHash}`);
      return {
        projectId: projectId,
        commitHash: commit.commitHash,
        commitMessage: commit.commitMessage,
        commitAuthorName: commit.commitAuthorName,
        commitAuthorAvatar: commit.commitAuthorAvatar,
        commitDate: commit.commitDate,
        summary: commit.summary,
      };
    }),
  });

  return commits;
};

async function summariseCommit(githubUrl: string, commitHash: string) {
  // Get the diff, and pass the diff into AI
  const { data } = await axios.get(`${githubUrl}/commit/${commitHash}.diff`, {
    headers: {
      Accept: "application/vnd.github.v3.diff",
    },
  });
  return (await aiSummariseCommit(data)) || "";
}

async function fetchProjectGithubUrl(projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { githubUrl: true },
  });
  if (!project?.githubUrl) {
    throw new Error("Project has no GitHub URL");
  }
  return { project, githubUrl: project?.githubUrl };
}

async function filterUnprocessedCommits(
  projectId: string,
  commitHashes: Response[],
) {
  const processedCommits = await db.commit.findMany({
    where: { projectId },
  });
  const unprocessedCommits = commitHashes.filter(
    (commit) =>
      !processedCommits.some(
        (processedCommits) => processedCommits.commitHash === commit.commitHash,
      ),
  );
  return unprocessedCommits;
}

// await pollCommits("cm85o7z6r0000kvjwoh74g2vw").then(console.log);
