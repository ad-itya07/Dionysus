"use server";
import { streamText } from "ai";
import { createStreamableValue } from "ai/rsc";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { db } from "@/server/db";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Detect if question is asking for project overview
 */
function isProjectOverviewQuestion(question: string): boolean {
  const lowerQuestion = question.toLowerCase();
  const overviewKeywords = [
    "tell me about",
    "what is this project",
    "what is the project",
    "overview",
    "describe this project",
    "describe the project",
    "explain this project",
    "explain the project",
    "what does this project do",
    "what is this codebase",
  ];
  return overviewKeywords.some((keyword) => lowerQuestion.includes(keyword));
}

/**
 * Extract keywords from question for text search
 */
function extractKeywords(question: string): string[] {
  // Remove common stop words and extract meaningful keywords
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "should",
    "could",
    "can",
    "may",
    "might",
    "this",
    "that",
    "these",
    "those",
    "i",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they",
    "what",
    "where",
    "when",
    "why",
    "how",
    "about",
  ]);

  return question
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .slice(0, 10); // Limit to 10 keywords
}

/**
 * Search files using text-based keyword matching
 */
async function searchFilesByText(
  projectId: string,
  keywords: string[],
  isOverview: boolean,
): Promise<{ fileName: string; sourceCode: string; summary: string }[]> {
  if (keywords.length === 0) {
    // If no keywords, return all files (for overview queries)
    const allFiles = await db.sourceCodeEmbedding.findMany({
      where: { projectId },
      select: {
        fileName: true,
        sourceCode: true,
        summary: true,
      },
      take: isOverview ? 30 : 15, // More files for overview
    });
    return allFiles;
  }

  // Build search conditions using Prisma query
  // We'll use a simpler approach with Prisma's string filters
  const keywordPatterns = keywords.map((k) => `%${k}%`);

  // Get all files for this project
  const allFiles = await db.sourceCodeEmbedding.findMany({
    where: { projectId },
    select: {
      fileName: true,
      sourceCode: true,
      summary: true,
    },
  });

  // Filter and rank files by relevance
  const scoredFiles = allFiles
    .map((file) => {
      const lowerFileName = file.fileName.toLowerCase();
      const lowerSourceCode = file.sourceCode.toLowerCase();
      const lowerSummary = file.summary.toLowerCase();

      let relevance = 0;
      let matches = false;

      // Check for README files (highest priority)
      const isReadme = lowerFileName.includes("readme");
      if (isReadme) relevance += 100;

      // Check filename matches
      for (const keyword of keywords) {
        if (lowerFileName.includes(keyword)) {
          relevance += 10;
          matches = true;
        }
      }

      // Check source code matches
      for (const keyword of keywords) {
        if (lowerSourceCode.includes(keyword)) {
          relevance += 5;
          matches = true;
        }
      }

      // Check summary matches
      for (const keyword of keywords) {
        if (lowerSummary.includes(keyword)) {
          relevance += 3;
          matches = true;
        }
      }

      return { ...file, relevance, matches: matches || isReadme };
    })
    .filter((file) => file.matches)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, isOverview ? 30 : 15);

  return scoredFiles;
}

/**
 * Get project overview context
 */
async function getProjectOverviewContext(projectId: string): Promise<string> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      name: true,
      githubUrl: true,
      createdAt: true,
    },
  });

  const commits = await db.commit.findMany({
    where: { projectId },
    orderBy: { commitDate: "desc" },
    take: 10,
    select: {
      commitMessage: true,
      summary: true,
      commitDate: true,
      commitAuthorName: true,
    },
  });

  const readmeFiles = await db.sourceCodeEmbedding.findMany({
    where: {
      projectId,
      fileName: {
        contains: "README",
        mode: "insensitive",
      },
    },
    select: {
      fileName: true,
      sourceCode: true,
      summary: true,
    },
    take: 5,
  });

  // Get project structure (unique file paths)
  const allFiles = await db.sourceCodeEmbedding.findMany({
    where: { projectId },
    select: { fileName: true },
    distinct: ["fileName"],
    take: 50,
  });

  let context = `PROJECT METADATA:\n`;
  context += `- Project Name: ${project?.name || "Unknown"}\n`;
  context += `- GitHub URL: ${project?.githubUrl || "Unknown"}\n`;
  context += `- Created: ${project?.createdAt?.toLocaleDateString() || "Unknown"}\n\n`;

  if (readmeFiles.length > 0) {
    context += `README FILES:\n`;
    for (const readme of readmeFiles) {
      context += `File: ${readme.fileName}\n`;
      context += `Summary: ${readme.summary}\n`;
      context += `Content Preview: ${readme.sourceCode.substring(0, 500)}...\n\n`;
    }
  }

  if (commits.length > 0) {
    context += `RECENT COMMITS (Last ${commits.length}):\n`;
    for (const commit of commits) {
      context += `- ${commit.commitAuthorName}: ${commit.commitMessage}\n`;
      if (commit.summary) {
        context += `  Summary: ${commit.summary}\n`;
      }
      context += `  Date: ${commit.commitDate.toLocaleDateString()}\n\n`;
    }
  }

  if (allFiles.length > 0) {
    context += `PROJECT STRUCTURE (Sample files):\n`;
    const fileList = allFiles
      .slice(0, 20)
      .map((f) => f.fileName)
      .join("\n- ");
    context += `- ${fileList}\n`;
    if (allFiles.length > 20) {
      context += `... and ${allFiles.length - 20} more files\n`;
    }
  }

  return context;
}

export async function askQuestion(question: string, projectId: string) {
  const stream = createStreamableValue();

  const isOverview = isProjectOverviewQuestion(question);
  const keywords = extractKeywords(question);

  let context = "";
  let filesReferences: { fileName: string; sourceCode: string; summary: string }[] = [];

  if (isOverview) {
    // For project overview, get comprehensive context
    const overviewContext = await getProjectOverviewContext(projectId);
    context += overviewContext + "\n\n";

    // Also get README and key files
    const readmeFiles = await db.sourceCodeEmbedding.findMany({
      where: {
        projectId,
        fileName: {
          contains: "README",
          mode: "insensitive",
        },
      },
      select: {
        fileName: true,
        sourceCode: true,
        summary: true,
      },
      take: 3,
    });

    filesReferences = readmeFiles;

    // Add some key source files (package.json, main entry points, etc.)
    const keyFiles = await db.sourceCodeEmbedding.findMany({
      where: {
        projectId,
        fileName: {
          in: [
            "package.json",
            "package.yaml",
            "requirements.txt",
            "Cargo.toml",
            "go.mod",
            "pom.xml",
            "index.ts",
            "index.js",
            "main.ts",
            "main.js",
            "app.ts",
            "app.js",
            "App.tsx",
            "App.jsx",
          ],
        },
      },
      select: {
        fileName: true,
        sourceCode: true,
        summary: true,
      },
      take: 5,
    });

    filesReferences = [...filesReferences, ...keyFiles];

    for (const file of filesReferences) {
      context += `FILE: ${file.fileName}\n`;
      context += `Summary: ${file.summary}\n`;
      context += `Content: ${file.sourceCode.substring(0, 1000)}${file.sourceCode.length > 1000 ? "..." : ""}\n\n`;
    }
  } else {
    // For specific questions, search by keywords
    filesReferences = await searchFilesByText(projectId, keywords, false);

    for (const doc of filesReferences) {
      context += `FILE: ${doc.fileName}\n`;
      context += `Summary: ${doc.summary}\n`;
      context += `Code Content: ${doc.sourceCode.substring(0, 2000)}${doc.sourceCode.length > 2000 ? "..." : ""}\n\n`;
    }
  }

  // Use different prompts for overview vs specific questions
  const basePrompt = isOverview
    ? `You are analyzing a GitHub project. Provide a comprehensive overview of this project based on the provided context. Include:
- Project purpose and main functionality
- Tech stack (infer from file types and package files)
- Project structure and organization
- Recent activity and development trends (from commits)
- Key features and capabilities
- How to get started or use the project

Be detailed but concise. Use markdown formatting. If you find a README file, prioritize that information.`
    : `You are an AI assistant who answers questions about codebases. Your target audience is a technical intern who is trying to understand the codebase.
AI assistant is a brand new, powerful, human-like artificial intelligence.
The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
AI is a well-behaved and well-mannered individual.
AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in the world.
If the question is asking about the code or a specific file, AI will provide the detailed answer, giving step by step instructions and explanations.
AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
If the context does not provide the answer to the question, the AI assistant will say, "I am sorry, but I don't know the answer."
AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
AI assistant will not invent anything that is not drawn directly from the context.
Answer in markdown syntax, with code snippets if needed. Be as detailed as possible when answering, make sure there is new information in the answer.`;

  (async () => {
    try {
      const { textStream } = await streamText({
        model: google("gemini-2.5-flash-lite"),
        prompt: `${basePrompt}

START CONTEXT BLOCK
${context}
END CONTEXT BLOCK

START QUESTION
${question}
END QUESTION`,
      });
      for await (const delta of textStream) {
        stream.update(delta);
      }
    } catch (error) {
      console.error("Error asking question:", error);
      stream.update("Sorry for the inconvenience. Your request couldn't be processed because either the AI provider usage limit has exceed or its undergoing an update. Please try asking the question again later :( ");
    } finally {
      stream.done();
    }
  })();

  return {
    output: stream.value,
    filesReferences: filesReferences.slice(0, 10), // Limit to 10 for display
  };
}
