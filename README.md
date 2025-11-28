# Dionysus

**Dionysus** is an AI-powered GitHub SaaS client designed to revolutionize project collaboration and management. With Dionysus, users can seamlessly integrate their GitHub repositories, explore commit histories, interact with AI to learn more about their projects, and manage their teams effectively. This platform leverages cutting-edge AI to simplify and enhance workflows, making teamwork effortless and efficient.

## Live Website
Visit the live platform here: [Dionysus](https://dionysus-se36.vercel.app/)

---

## Key Features

### 1. **GitHub Integration**
- Link your projects directly using your GitHub repository URL.
- View and analyze the complete commit history of your repository.
- Ask AI-powered questions about your repository and its functionalities to gain insights and improve understanding.

### 2. **AI-Powered Audio Transcription and Summarization**
- Upload audio files of your meetings.
- Get a transcript of the audio file with time stamps.
- Receive a concise AI-generated summary of the meeting, powered by **Assembly AI**.

### 3. **Team Collaboration**
- Invite team members to work on projects collaboratively.
- Generate a unique invitation URL for each project. When another Dionysus user clicks the URL, they can join the project and start collaborating.
- Share your project and work together seamlessly.

### 4. **AI Assistance**
- AI responses and functionalities powered by **Gemini AI** to assist with repository-related queries and insights.

### 5. **Credit System for Pricing**
- Pricing is based on a credit system:
  - Purchase 50 credits for 75 INR.
  - Each audio file upload deducts 1 credit.

### 6. **Authentication**
- User authentication is powered by **Clerk** for secure and seamless login and account management.

---

## Pricing
- **Credits:**
  - 50 credits cost **75 INR**.
  - Each file upload consumes **1 credit**.

---

## Tech Stack

### Frontend
- Developed using **Next.js**, **React**, **TypeScript**, and **Tailwind CSS**.
- UI components from **shadcn/ui**.
- Animations with **framer-motion**.
- Deployed on **Vercel**.

### Backend
- **Next.js API Routes** with **tRPC** for type-safe APIs.
- **PostgreSQL** database with **Prisma ORM** and **pgvector** extension for embeddings.
- AI transcription handled by **Assembly AI**.
- AI responses and interactions powered by **Google Gemini AI** (gemini-2.0-flash for summarization, text-embedding-004 for embeddings).
- File uploads via **Cloudinary**.
- Payments via **Stripe**.

### Authentication
- User authentication managed through **Clerk**.

---

## How to Use

### Step 1: Link Your GitHub Repository
- Copy your GitHub repository URL and paste it on the platform to link your project.

### Step 2: Explore and Interact
- View commit histories.
- Use AI to ask questions about your repository and understand its functionalities.

### Step 3: Upload Audio Files
- Upload audio recordings of your meetings.
- Receive transcripts with timestamps and AI-generated summaries.

### Step 4: Collaborate with Your Team
- Use the "Invite Team Members" feature to share your project.
- Generate an invitation URL and share it with your team. Once they click the link and join Dionysus, they can collaborate on your project.

---

## Getting Started

1. Visit the live platform: [Dionysus](https://dionysus-se36.vercel.app/).
2. Sign up or log in using **Clerk** authentication.
3. Purchase credits to start using the platform, by default each user will be given 150 credits.
4. Link your GitHub repository to get started.
5. Collaborate, upload, and manage your projects effectively.

---

---

## Environment Variables

The following environment variables are required for the application to function:

### Database
- **DATABASE_URL**: PostgreSQL connection string with pgvector extension support (required)

### GitHub API
- **GITHUB_TOKEN**: GitHub Personal Access Token with `repo` scope (optional, used as fallback for public repos)

### Google Gemini AI
- **GEMINI_API_KEY**: API key for commit summarization, code summarization, and embedding generation (required)

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
- **ASSEMBLYAI_API_KEY**: API key for audio transcription (required)

### Optional
- **NODE_ENV**: Environment mode (`development`, `production`, or `test`, defaults to `development`)
- **SKIP_ENV_VALIDATION**: Skip environment variable validation (useful for Docker builds)

---

## Backend Architecture

### Ingestion Pipeline

The repository ingestion process follows a robust, multi-stage pipeline:

1. **Validation**: Validates repository access and GitHub URL format
2. **File Fetching**: Loads all repository files using pagination
3. **Summarization**: Generates AI summaries for each file with retry logic and fallbacks
4. **Chunking**: Splits large files into 8KB chunks with 1KB overlap for better embedding quality
5. **Embedding Generation**: Creates 768-dimensional embeddings with validation and idempotency
6. **Commit Processing**: Fetches and summarizes commits with pagination support
7. **Status Tracking**: Updates project ingestion status throughout the process

### Key Features

- **Pagination**: Handles repositories with 1000+ commits and deep directory structures
- **Rate Limit Handling**: Automatically waits for GitHub API rate limit resets
- **Retry Logic**: Exponential backoff retries for all API calls (up to 3 attempts)
- **Idempotency**: Safe to re-run ingestion without creating duplicates
- **Error Recovery**: Failed ingestions can be resumed, with error messages stored
- **Status Tracking**: Real-time ingestion status (PENDING, IN_PROGRESS, COMPLETED, FAILED)
- **Fallback Summaries**: Never returns empty summaries - always provides at least a basic fallback

### Database Schema

- **Uniqueness Constraints**: Prevents duplicate commits and embeddings
- **Indexes**: Optimized queries on `commitHash`, `projectId`, and `fileName`
- **Ingestion Status**: Tracks ingestion progress and errors
- **Chunking Support**: Stores multiple embeddings per file with chunk indices

### API Reliability

- **GitHub API**: Full pagination support, rate limit handling, retry logic
- **Gemini AI**: Retry logic with exponential backoff, input validation, timeout handling
- **Embedding Validation**: Ensures all embeddings are 768 dimensions with finite values

---

## Troubleshooting

### Ingestion Failures

If a repository ingestion fails:

1. Check the project's `ingestionStatus` and `ingestionErrorMessage` fields
2. Verify all environment variables are set correctly
3. Check GitHub API rate limits and token permissions
4. Verify Gemini API key is valid and has sufficient quota
5. Check database connection and schema migrations are applied

### Common Issues

- **Rate Limit Errors**: The system automatically handles rate limits, but if issues persist, check your GitHub token permissions
- **Empty Summaries**: The system always provides fallback summaries, but if you see empty summaries, check Gemini API key
- **Duplicate Embeddings**: The system is idempotent - re-running ingestion won't create duplicates
- **Migration Errors**: Ensure you've run `npx prisma migrate deploy` to apply database migrations

---

## Contact
For any queries or support, feel free to reach out via the platform's support section.

