import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { checkCredits } from "@/lib/github-loader";
import { ingestRepository } from "@/lib/ingestion/orchestrator";
import { IngestionStatus } from "@prisma/client";

export const projectRouter = createTRPCRouter({
  createProject: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        githubUrl: z.string(),
        githubToken: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.user.userId! },
        select: { credits: true },
      });
      if (!user) {
        throw new Error("User not found");
      }
      const currentCredits = user.credits || 0;
      const fileCount = await checkCredits(input.githubUrl, input.githubToken);

      if (fileCount > currentCredits) {
        throw new Error("Insufficient credits");
      }

      // Create project with PENDING status
      const project = await ctx.db.project.create({
        data: {
          githubUrl: input.githubUrl,
          name: input.name,
          ingestionStatus: IngestionStatus.PENDING,
          ingestionProgress: 0,
          ingestionFilesProcessed: 0,
          ingestionCommitsProcessed: 0,
          userToProjects: {
            create: {
              userId: ctx.user.userId!,
            },
          },
        },
        select: {
          id: true,
          name: true,
          githubUrl: true,
          createdAt: true,
          updatedAt: true,
          ingestionStatus: true,
          ingestionProgress: true,
          ingestionFilesTotal: true,
          ingestionFilesProcessed: true,
          ingestionCommitsTotal: true,
          ingestionCommitsProcessed: true,
          ingestionErrorMessage: true,
        },
      });

      // Start ingestion asynchronously (don't await - let it run in background)
      ingestRepository(project.id, input.githubUrl, {
        githubToken: input.githubToken,
      })
        .then(() => {
          console.log(`✅ Ingestion completed for project ${project.id}`);
        })
        .catch((error) => {
          console.error(`❌ Failed to ingest project ${project.id}:`, error);
          // Update project status to FAILED on error
          ctx.db.project
            .update({
              where: { id: project.id },
              data: {
                ingestionStatus: IngestionStatus.FAILED,
                ingestionErrorMessage:
                  error instanceof Error ? error.message : String(error),
                ingestionCompletedAt: new Date(),
              },
            })
            .catch((updateError) => {
              console.error(
                `Failed to update project status to FAILED:`,
                updateError,
              );
            });
        });

      // Deduct credits only after successful project creation
      // Note: In production, you might want to deduct credits only after successful ingestion
      // For now, we deduct immediately as the old code did
      await ctx.db.user.update({
        where: { id: ctx.user.userId! },
        data: { credits: { decrement: fileCount } },
      });

      return project;
    }),

  getProjects: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.project.findMany({
      where: {
        userToProjects: {
          some: {
            userId: ctx.user.userId!,
          },
        },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        githubUrl: true,
        createdAt: true,
        updatedAt: true,
        ingestionStatus: true,
        ingestionProgress: true,
        ingestionFilesTotal: true,
        ingestionFilesProcessed: true,
        ingestionCommitsTotal: true,
        ingestionCommitsProcessed: true,
        ingestionErrorMessage: true,
      },
    });
  }),

  getIngestionStatus: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
        select: {
          ingestionStatus: true,
          ingestionProgress: true,
          ingestionFilesTotal: true,
          ingestionFilesProcessed: true,
          ingestionCommitsTotal: true,
          ingestionCommitsProcessed: true,
          ingestionErrorMessage: true,
        },
      });

      if (!project) {
        throw new Error("Project not found");
      }

      return {
        ...project,
        canUseQA: project.ingestionStatus === "COMPLETED",
      };
    }),
  getCommits: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Poll commits asynchronously (don't block the query)
      import("@/lib/github")
        .then(({ pollCommits }) => pollCommits(input.projectId))
        .catch((error) => {
          console.error(`Failed to poll commits for ${input.projectId}:`, error);
        });

      return await ctx.db.commit.findMany({
        where: { projectId: input.projectId },
        orderBy: { commitDate: "desc" },
        take: 50, // Limit to recent commits
      });
    }),
  saveAnswer: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        question: z.string(),
        answer: z.string(),
        filesReferences: z.any(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.question.create({
        data: {
          answer: input.answer,
          filesReferences: input.filesReferences,
          projectId: input.projectId,
          question: input.question,
          userId: ctx.user.userId!,
        },
      });
    }),
  getQuestions: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.question.findMany({
        where: {
          projectId: input.projectId,
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),
  archiveProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.project.update({
        where: {
          id: input.projectId,
        },
        data: {
          deletedAt: new Date(),
        },
      });
    }),
  getTeamMembers: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.userToProject.findMany({
        where: {
          projectId: input.projectId,
        },
        include: {
          user: true,
        },
      });
    }),
  getMyCredits: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.user.findUnique({
      where: {
        id: ctx.user.userId!,
      },
      select: {
        credits: true,
      },
    });
  }),
  checkCredits: protectedProcedure
    .input(
      z.object({ githubUrl: z.string(), githubToken: z.string().optional() }),
    )
    .mutation(async ({ ctx, input }) => {
      const fileCount = await checkCredits(input.githubUrl, input.githubToken);
      const userCredits = await ctx.db.user.findUnique({
        where: { id: ctx.user.userId! },
        select: { credits: true },
      });
      return { fileCount, userCredits: userCredits?.credits || 0 };
    }),

  getMeetings: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify user has access to this project
      const userProject = await ctx.db.userToProject.findFirst({
        where: {
          userId: ctx.user.userId!,
          projectId: input.projectId,
        },
      });

      if (!userProject) {
        throw new Error("Project not found or access denied");
      }

      return await ctx.db.meeting.findMany({
        where: {
          projectId: input.projectId,
        },
        include: {
          issues: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  deleteMeeting: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify user has access to the meeting's project
      const meeting = await ctx.db.meeting.findUnique({
        where: { id: input.meetingId },
        select: { projectId: true },
      });

      if (!meeting) {
        throw new Error("Meeting not found");
      }

      const userProject = await ctx.db.userToProject.findFirst({
        where: {
          userId: ctx.user.userId!,
          projectId: meeting.projectId,
        },
      });

      if (!userProject) {
        throw new Error("Access denied");
      }

      return await ctx.db.meeting.delete({
        where: { id: input.meetingId },
      });
    }),

  uploadMeeting: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        meetingUrl: z.string(),
        name: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user has access to this project
      const userProject = await ctx.db.userToProject.findFirst({
        where: {
          userId: ctx.user.userId!,
          projectId: input.projectId,
        },
      });

      if (!userProject) {
        throw new Error("Project not found or access denied");
      }

      return await ctx.db.meeting.create({
        data: {
          projectId: input.projectId,
          meetingUrl: input.meetingUrl,
          name: input.name,
        },
      });
    }),

  restartIngestion: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify user has access to this project
      const userProject = await ctx.db.userToProject.findFirst({
        where: {
          userId: ctx.user.userId!,
          projectId: input.projectId,
        },
      });

      if (!userProject) {
        throw new Error("Project not found or access denied");
      }

      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
        select: { githubUrl: true },
      });

      if (!project) {
        throw new Error("Project not found");
      }

      // Reset status and start ingestion
      await ctx.db.project.update({
        where: { id: input.projectId },
        data: {
          ingestionStatus: IngestionStatus.PENDING,
          ingestionProgress: 0,
          ingestionFilesProcessed: 0,
          ingestionCommitsProcessed: 0,
          ingestionErrorMessage: null,
        },
      });

      // Start ingestion asynchronously
      ingestRepository(input.projectId, project.githubUrl, {})
        .then(() => {
          console.log(`✅ Ingestion restarted and completed for project ${input.projectId}`);
        })
        .catch((error) => {
          console.error(`❌ Failed to restart ingestion for project ${input.projectId}:`, error);
        });

      return { success: true };
    }),
});
