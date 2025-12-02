# Dionysus

**Dionysus** is an AI-powered GitHub SaaS client designed to revolutionize project collaboration and management. With Dionysus, users can seamlessly integrate their GitHub repositories, explore commit histories, interact with AI to learn more about their projects, and manage their teams effectively. This platform leverages cutting-edge AI to simplify and enhance workflows, making teamwork effortless and efficient.

## Live Website
Visit the live platform here: [Dionysus](https://dionysus-se36.vercel.app/)

---

## Key Features

### 1. **GitHub Integration & Repository Processing**
- Link your projects directly using your GitHub repository URL.
- **Intelligent Repository Ingestion**: Automatically processes all files in your repository with AI-powered summarization.
- **Commit History Analysis**: View and analyze complete commit history with AI-generated summaries for recent commits.
- **Real-time Processing Status**: Track ingestion progress with detailed status updates (files processed, commits processed, progress percentage).

### 2. **AI-Powered Question & Answer System**
- Ask natural language questions about your repository and get intelligent, context-aware answers.
- **Smart Context Retrieval**: Uses keyword-based text search to find relevant code files and context.
- **Project Overview Mode**: Automatically detects overview questions and provides comprehensive project insights.
- **Code References**: Answers include references to relevant source files with code snippets.
- **Streaming Responses**: Real-time streaming answers powered by Google Gemini AI.

### 3. **AI-Powered Audio Transcription and Summarization**
- Upload audio files of your meetings via drag-and-drop interface.
- Get automatic transcription with timestamps using **Assembly AI**.
- Receive AI-generated chapter summaries with headlines, gists, and detailed summaries.
- Track meeting processing status in real-time.

### 4. **Team Collaboration**
- Invite team members to work on projects collaboratively.
- Generate unique invitation URLs for each project.
- When another Dionysus user clicks the URL, they can join the project and start collaborating.
- Share your project and work together seamlessly.

### 5. **Credit System for Pricing**
- Pricing is based on a credit system:
  - Purchase credits starting from 10 credits (minimum) up to 1000 credits.
  - Pricing: 50 credits cost **75 INR** (1.5 INR per credit).
  - Each repository file requires 1 credit to index.
  - New users receive **150 free credits** to get started.

### 6. **Authentication**
- User authentication is powered by **Clerk** for secure and seamless login and account management.
- Social login support (Google OAuth).

---

## Pricing

- **Credits:**
  - 50 credits cost **75 INR** (1.5 INR per credit).
  - Each repository file consumes **1 credit** during ingestion.
  - New users receive **150 free credits** upon signup.

---

## Tech Stack

### Frontend
- **Next.js 15** with **React 18** and **TypeScript**.
- **Tailwind CSS** for styling with custom design system.
- UI components from **shadcn/ui**.
- Animations with **framer-motion**.
- Form handling with **react-hook-form** and **zod**.
- State management with **TanStack Query (React Query)**.
- Deployed on **Vercel**.

### Backend
- **Next.js API Routes** with **tRPC** for type-safe APIs.
- **PostgreSQL** database with **Prisma ORM**.
- **pgvector** extension available (currently not used - cost optimization).
- AI transcription handled by **Assembly AI**.
- AI responses and code summarization powered by **Google Gemini AI**:
  - **gemini-2.0-flash-001** for Q&A and code summarization
  - **gemini-2.0-flash** for commit summarization
- File uploads via **Cloudinary**.
- Payments via **Stripe**.

### Authentication
- User authentication managed through **Clerk**.

---

## How It Works

### GitHub Repository Processing Flow

When you link a GitHub repository, Dionysus follows a sophisticated multi-stage ingestion pipeline:

1. **Repository Validation (10%)**
   - Validates GitHub URL format and repository access.
   - Checks if the repository is accessible with provided credentials.

2. **File Fetching (20%)**
   - Fetches all files from the repository using GitHub API with pagination support.
   - Handles large repositories with thousands of files efficiently.

3. **AI Summarization (20-60%)**
   - Generates AI-powered summaries for each file using **Google Gemini 2.0 Flash**.
   - Each file gets a unique, context-aware summary (up to 100 words).
   - Includes retry logic and fallback summaries for reliability.
   - Rate limiting protection (2-second delay every 10 files).

4. **File Chunking & Storage (60-80%)**
   - Large files are split into 8KB chunks with 1KB overlap for better context.
   - Files are stored in the database with summaries for on-demand text search.
   - **Cost Optimization**: Embeddings are NOT generated - uses efficient text-based search instead.

5. **Commit Processing (80-95%)**
   - Fetches up to 100 most recent commits from the repository.
   - **Smart Summarization**: Only the last 6-8 commits receive AI-generated summaries.
   - Older commits use commit messages directly (cost optimization).
   - All commits are stored with metadata (author, date, message, summary).

6. **Completion (100%)**
   - Marks ingestion as completed.
   - Repository is now ready for Q&A and exploration.

### AI Question & Answer Flow

The Q&A system uses an intelligent, cost-optimized approach:

1. **Question Analysis**
   - Detects if the question is asking for a project overview or specific information.
   - Extracts keywords from the question (removes stop words, focuses on meaningful terms).

2. **Context Retrieval**
   - **For Overview Questions**: Retrieves README files, key configuration files (package.json, etc.), recent commits, and project structure.
   - **For Specific Questions**: Uses keyword-based text search across:
     - File names (highest priority)
     - Source code content
     - File summaries
   - Prioritizes README files and files with matching keywords.

3. **Answer Generation**
   - Uses **Google Gemini 2.0 Flash** with carefully crafted prompts.
   - Provides streaming responses for real-time user experience.
   - Includes code references and file citations.
   - Answers are context-aware and based solely on the repository content.

4. **Response Delivery**
   - Streams answers token-by-token for immediate feedback.
   - Displays relevant code files and references.
   - Allows saving answers for future reference.

### Meeting Processing Flow

1. **Upload**: Audio file is uploaded to Cloudinary via drag-and-drop interface.
2. **Transcription**: Assembly AI transcribes the audio with automatic chapter detection.
3. **Summarization**: Assembly AI generates:
   - Chapter headlines
   - Chapter gists (brief summaries)
   - Detailed chapter summaries
   - Timestamps for each chapter
4. **Storage**: Meeting data is stored with issues (chapters) linked to the project.

---

## Getting Started

1. Visit the live platform: [Dionysus](https://dionysus-se36.vercel.app/).
2. Sign up or log in using **Clerk** authentication (Google OAuth supported).
3. Start using the platform - each user gets **150 free credits** to get started.
4. Link your GitHub repository:
   - Go to "Create Project"
   - Enter your repository URL
   - Optionally provide a GitHub Personal Access Token for private repos
   - Check credits required and create the project
5. Wait for ingestion to complete (progress is tracked in real-time).
6. Once complete, start asking questions about your codebase!
7. Upload meeting audio files for transcription and summarization.
8. Invite team members to collaborate on projects.

---

## Environment Variables

The following environment variables are required for the application to function:

### Database
- **DATABASE_URL**: PostgreSQL connection string (required)
  - Should support pgvector extension (though currently not used for cost optimization)

### GitHub API
- **GITHUB_TOKEN**: GitHub Personal Access Token with `repo` scope (optional, used for private repos and rate limit handling)

### Google Gemini AI
- **GEMINI_API_KEY**: API key for code summarization, commit summarization, and Q&A (required)
  - Used models: `gemini-2.0-flash-001` (Q&A), `gemini-2.0-flash` (summarization)

### Clerk Authentication
- **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY**: Clerk publishable key for frontend (required)
- **CLERK_SECRET_KEY**: Clerk secret key for backend authentication (required)

### Stripe Payments
- **STRIPE_SECRET_KEY**: Stripe secret key for payment processing (required)
- **STRIPE_WEBHOOK_SECRET**: Stripe webhook signing secret (required)
- **NEXT_PUBLIC_BASE_URL**: Base URL for redirects (required)

### Cloudinary (Meeting Uploads)
- **NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME**: Cloudinary cloud name (required)
- **NEXT_PUBLIC_UNSIGNED_PRESET_NAME**: Cloudinary unsigned upload preset name (required)

### AssemblyAI (Meeting Transcription)
- **ASSEMBLYAI_API_KEY**: API key for audio transcription and chapter generation (required)

### Optional
- **NODE_ENV**: Environment mode (`development`, `production`, or `test`, defaults to `development`)
- **SKIP_ENV_VALIDATION**: Skip environment variable validation (useful for Docker builds)

---

## Backend Architecture

### Ingestion Pipeline

The repository ingestion process follows a robust, multi-stage pipeline optimized for cost and performance:

1. **Validation**: Validates repository access and GitHub URL format
2. **File Fetching**: Loads all repository files using GitHub API pagination
3. **AI Summarization**: Generates AI summaries for each file using Gemini 2.0 Flash with retry logic and fallbacks
4. **Chunking**: Splits large files into 8KB chunks with 1KB overlap for better context handling
5. **Storage**: Stores files with summaries for text-based search (embeddings skipped for cost optimization)
6. **Commit Processing**: Fetches and processes commits (AI summaries for recent 6-8 commits only)
7. **Status Tracking**: Real-time progress updates throughout the process

### Key Features

- **Cost Optimization**: No embedding generation - uses efficient text-based keyword search
- **Pagination**: Handles repositories with 1000+ files and deep directory structures
- **Rate Limit Handling**: Automatically handles GitHub API rate limits with intelligent waiting
- **Retry Logic**: Exponential backoff retries for all API calls (up to 3 attempts)
- **Idempotency**: Safe to re-run ingestion without creating duplicates
- **Error Recovery**: Failed ingestions can be resumed, with error messages stored
- **Status Tracking**: Real-time ingestion status (PENDING, IN_PROGRESS, READY, COMPLETED, FAILED)
- **Fallback Summaries**: Never returns empty summaries - always provides at least a basic fallback
- **Progress Tracking**: Detailed progress with file counts, commit counts, and percentage

### Question Answering System

The Q&A system uses a sophisticated text-based search approach:

- **Keyword Extraction**: Intelligent keyword extraction with stop word filtering
- **Text Search**: Searches across file names, source code, and summaries
- **Relevance Scoring**: Ranks files by relevance (README files prioritized)
- **Context Building**: Constructs comprehensive context from relevant files
- **Streaming Responses**: Real-time streaming answers using AI SDK
- **Project Overview Detection**: Automatically detects and handles overview questions differently

### Database Schema

- **Uniqueness Constraints**: Prevents duplicate commits and file chunks
- **Indexes**: Optimized queries on `commitHash`, `projectId`, and `fileName`
- **Ingestion Status**: Tracks ingestion progress, errors, and completion
- **Chunking Support**: Stores multiple chunks per file with chunk indices
- **Text Search Ready**: Schema supports text-based search (embeddings optional)

### API Reliability

- **GitHub API**: Full pagination support, rate limit handling, retry logic
- **Gemini AI**: Retry logic with exponential backoff, input validation, timeout handling
- **Assembly AI**: Automatic chapter detection and summarization
- **Error Handling**: Comprehensive error handling with user-friendly messages

---

## Troubleshooting

### Ingestion Failures

If a repository ingestion fails:

1. Check the project's `ingestionStatus` and `ingestionErrorMessage` fields in the dashboard
2. Verify all environment variables are set correctly
3. Check GitHub API rate limits and token permissions
4. Verify Gemini API key is valid and has sufficient quota
5. Check database connection and schema migrations are applied
6. Use the "Mark as Complete" button if ingestion appears stuck but files/commits are processed

### Common Issues

- **Rate Limit Errors**: The system automatically handles rate limits, but if issues persist, check your GitHub token permissions
- **Empty Summaries**: The system always provides fallback summaries, but if you see empty summaries, check Gemini API key
- **Duplicate Files**: The system is idempotent - re-running ingestion won't create duplicates
- **Migration Errors**: Ensure you've run `npx prisma migrate deploy` to apply database migrations
- **Stuck Processing**: If ingestion appears stuck but commits are visible, use the "Mark as Complete" button in the ingestion status banner

### Question Answering Issues

- **No Answers**: Ensure ingestion is completed (status should be COMPLETED)
- **Incomplete Answers**: Check if relevant files exist in the repository
- **Slow Responses**: Large repositories may take longer to search - this is normal

---

## Development

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database with pgvector extension
- All environment variables configured

### Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env`
4. Run database migrations: `npx prisma migrate deploy`
5. Generate Prisma client: `npx prisma generate`
6. Start development server: `npm run dev`

### Database Migrations
- Create migration: `npx prisma migrate dev --name migration_name`
- Apply migrations: `npx prisma migrate deploy`
- Generate client: `npx prisma generate`

---

## Contact
For any queries or support, feel free to reach out via the platform's support section.
