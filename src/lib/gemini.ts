import { GoogleGenerativeAI } from "@google/generative-ai";
import { Document } from "@langchain/core/documents";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

export const aiSummariseCommit = async (diff: string) => {
  // https:github.com/docker/dionysus/commit/<commitHash>.diff
  const reponse = await model.generateContent([
    `You are an expert programmer, and your task is to summarise the changes in a Git diff. Below are some reminders and guidelines about the Git diff format and the summarisation process:

        ### Git Diff Format:
        1. **Metadata Lines**:
            - Each file in the diff starts with metadata lines that include:
                \`\`\`
                diff --git a/<filepath> b/<filepath>
                index <hash1>..<hash2> <filemode>
                --- a/<filepath>
                +++ b/<filepath>
                \`\`\`
            - These lines indicate the file being modified and its state before and after the changes.
        
        2. **Change Indicators**:
            - Lines that start with:
                - **"+"**: Added lines.
                - **"-"**: Removed lines.
                - **" " (space)**: Unchanged lines for context.
            - Example:
                \`\`\`
                - function oldFunction() {
                + function newFunction() {
                \`\`\`
        
        3. **File Creation/Deletion**:
            - For new files:
                \`\`\`
                new file mode <filemode>
                \`\`\`
            - For deleted files:
                \`\`\`
                deleted file mode <filemode>
                \`\`\`
        
        4. **Hunks**:
            - Each hunk begins with a line like:
                \`\`\`
                @@ -<start-line-old>,<line-count-old> +<start-line-new>,<line-count-new> @@
                \`\`\`
            - This shows where changes have occurred in the file.
        
        ---
        
        ### Instructions for Summarisation:
        1. **For Each File**:
            - Mention the filename and summarize the key changes (e.g., additions, deletions, modifications).
            - If the file is new or deleted, explicitly state this.
        
        2. **Content Changes**:
            - Highlight key changes in the code logic, structure, or functionality.
            - If specific functions, variables, or classes were modified, mention their names and the nature of the change (e.g., added a parameter, changed return type, fixed a bug).
        
        3. **Purpose of Changes**:
            - If possible, infer the purpose of the changes based on the diff. For example:
                - "Refactored code for better readability."
                - "Fixed a bug in the login functionality."
                - "Added a new API endpoint for user authentication."
        
        4. **Ignore Noisy Changes**:
            - Skip insignificant changes like formatting or whitespace (unless they dominate the diff).
        
        ---
        
        ### Output Format:
        1. Use a clear and concise bullet-point structure.
        2. Summarise changes per file, like this:
            * File: <filename>
                * Change Type: Modified/New/Deleted
                * Summary: Describe what was added/removed/modified and why.
        
        ---
        
        Most of the commits will have less comments than this examples list.
        The last comment doesnot include the file names because there were more than two relevant files in the hypothetical commit.
        Does not include parts of the example in your summary.
        It is given only as an example of appropriate comments.
        Now, using the above guidelines, generate a summary of the following diff file: \n\n\n${diff}
            `,
  ]);

  return reponse.response.text();
};

export const summariseCode = async (doc: Document) => {
  console.log("getting summary for", doc.metadata.source);
  //   try {
  const code = doc.pageContent.slice(0, 10000);
  const response = await model.generateContent([
    `You are an intelligent senior software engineer who specialises in onboarding junior software engineers onto projects.
        You are onboarding a junior software engineer and explaining to them he purpose of the ${doc.metadata.source} file.
        Here is the code snippet:
        
        ---
        
        ${code}
        
        ---
        
        Give a summary no more than 100 words of the code above`,
  ]);

  return response.response.text();
  //   } catch (error) {
  // return "error";
  //   }
};

export const generateEmbedding = async (summary: string) => {
  const model = genAI.getGenerativeModel({
    model: "text-embedding-004",
  });

  const result = await model.embedContent(summary);
  const embedding = result.embedding;

  return embedding.values;
};
