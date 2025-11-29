// npx tsx src/lib/gemini.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Document } from "@langchain/core/documents";
import { env } from "@/env";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

// Rate limiting to prevent API issues
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 200; // 200ms between requests

async function rateLimitedRequest<T>(fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest),
    );
  }
  lastRequestTime = Date.now();
  return fn();
}

export const aiSummariseCommit = async (diff: string) => {
  return rateLimitedRequest(async () => {
    // https://github.com/owner/repo/commit/<commitHash>.diff
    const response = await model.generateContent([
      `Your are an expert programmer, and you are trying to summarize a git file.
        Reminders about the git diff format:
        For every file, there are a few metadata lines, like (for example):
        \`\`\`
        diff --git a/src/lib/index.js b/src/lib/index.js
        index aadf691..bfef603 100644
        --- a/src/lib/index.js
        +++ b/src/lib/index.js
        \`\`\`
        This means that \`lib/index.js\` was modified in this commit. Note that this is only an example.
        Then there is a specifier of the lines that were modified.
        A line starting with \`+\` means it was added.
        A line that starting with \`-\` means that line was deleted.
        A line that starts with neither \`+\` nor \`-\` is code given for context and better understanding.
        It is not part of the diff.
        [...]
        EXAMPLE SUMMARY COMMENTS:
        \`\`\`
        * Raised the amount of returned recordings from \`10\` to \`100\` [packeges/server/recordings_api.ts], [packages/server/constants.ts]
        * Fixed a typo in the github action name [.github/workflows/gpt-commit-summarizer.yml]
        * Moved the \`octokit\` initialization to a separate file [src/octokit.ts], [src/index.ts]
        * Added an OpenAI API for completions [packages/utils/apis/openai.ts]
        * Lowered numeric tolerance for test files
        \`\`\`
        Most commits will have less comments than this example list.
        The last comment does not include the file names, because there were more than two relevant files in the hypothetical commit.
        Do not include parts of the example in your summary.
        It is given only as an example of appropirate comments.`,
      `Please summarise the following diff file: \n\n${diff}`,
    ]);
    return response.response.text();
  });
};

export async function summariseCode(doc: Document): Promise<string> {
  return rateLimitedRequest(async () => {
    console.log("getting summary for ", doc.metadata.source);
    try {
      const code = doc.pageContent.slice(0, 10000); // Limit to 10000 characters
      
      // Include file name in prompt to ensure unique context
      const fileName = doc.metadata.source as string;
      
      const response = await model.generateContent([
        `You are an intelligent senior software engineer who specialises in onboarding junior software engineers onto projects`,
        `You are onboarding a junior software engineer and explaining to them the purpose of the ${fileName} file.
        IMPORTANT: Provide a unique, specific summary for THIS file. Do not give generic responses.
        Here is the code:
        ---
        ${code}
        ---
        Give a summary no more than 100 words of the code above. Be specific to this file's content and purpose.`,
      ]);

      const summary = response.response.text();
      
      // Validate summary is meaningful
      if (!summary || summary.trim().length < 20) {
        throw new Error("Summary too short or empty");
      }
      
      return summary;
    } catch (error) {
      console.error("Error summarizing code:", error);
      throw error; // Let retry logic handle it
    }
  });
}

export async function generateEmbedding(summary: string): Promise<number[]> {
  const embeddingModel = genAI.getGenerativeModel({
    model: "text-embedding-004",
  });
  const result = await embeddingModel.embedContent(summary);
  const embedding = result.embedding;
  
  // Validate embedding
  if (!embedding || !embedding.values || embedding.values.length !== 768) {
    throw new Error(`Invalid embedding: expected 768 dimensions, got ${embedding.values?.length || 0}`);
  }
  
  // Validate all values are finite numbers
  for (const value of embedding.values) {
    if (!Number.isFinite(value)) {
      throw new Error("Invalid embedding: contains non-finite values");
    }
  }
  
  return embedding.values;
}
