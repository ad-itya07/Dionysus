"use client";

import useProject from "@/hooks/use-project";
import { ExternalLink, Github } from "lucide-react";
import Link from "next/link";
import CommitLog from "./_components/CommitLog";
import AskQuestionCard from "./_components/AskQuestionCard";
import MeetingCard from "./_components/MeetingCard";
import ArchiveButton from "./_components/ArchiveButton";
import TeamMembers from "./_components/TeamMembers";
import IngestionStatus from "./_components/IngestionStatus";
import EmptyProjectState from "./_components/EmptyProjectState";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { api } from "@/trpc/react";

const InviteButton = dynamic(() => import("./_components/InviteButton"), {
  ssr: false,
});

type Props = {};

const page = ({}: Props) => {
  const { project, projectId, projects } = useProject();
  const { data: ingestionStatus } = api.project.getIngestionStatus.useQuery(
    { projectId: projectId ?? "" },
    {
      enabled: !!projectId && projectId !== "",
      staleTime: 10000, // Cache for 10 seconds
      refetchOnWindowFocus: false,
      refetchInterval: (query) => {
        // Only poll if ingestion is in progress
        const data = query.state.data;
        if (data?.ingestionStatus === "IN_PROGRESS") {
          return 5000; // Poll every 5 seconds
        }
        return false; // Don't poll if completed or failed
      },
    },
  );

  // Show empty state if no project selected
  if (!project) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-3"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-2 leading-relaxed">
              Overview of your project activity and insights
            </p>
          </div>
        </motion.div>
        <EmptyProjectState hasProjects={(projects?.length ?? 0) > 0} />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Ingestion Status Banner */}
      {ingestionStatus &&
        ingestionStatus.ingestionStatus !== "COMPLETED" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <IngestionStatus
              status={ingestionStatus.ingestionStatus}
              progress={ingestionStatus.ingestionProgress}
              filesProcessed={ingestionStatus.ingestionFilesProcessed ?? undefined}
              filesTotal={ingestionStatus.ingestionFilesTotal ?? undefined}
              commitsProcessed={ingestionStatus.ingestionCommitsProcessed ?? undefined}
              commitsTotal={ingestionStatus.ingestionCommitsTotal ?? undefined}
              errorMessage={ingestionStatus.ingestionErrorMessage}
            />
          </motion.div>
        )}

      {/* Enhanced Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-4 sm:gap-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl">
              Overview of your project activity and insights
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <TeamMembers />
            <InviteButton />
            <ArchiveButton />
          </div>
        </div>

        {/* Enhanced GitHub Link Card */}
        {project?.githubUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="group relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-primary/5 p-4 sm:p-5 shadow-glow-cyan-sm transition-all duration-300 hover:border-primary/50 hover:shadow-glow-cyan hover:scale-[1.02]"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <motion.div
                className="rounded-xl bg-primary/20 p-2.5 group-hover:bg-primary/30 transition-colors"
                whileHover={{ rotate: 5, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Github className="h-5 w-5 text-primary" aria-hidden="true" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-foreground mb-1">
                  Linked Repository
                </p>
                <Link
                  href={project.githubUrl}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm text-primary hover:text-primary/80 transition-colors group/link focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${project.githubUrl} in new tab`}
                >
                  <span className="truncate">{project.githubUrl}</span>
                  <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Enhanced Quick Actions Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 lg:items-stretch"
      >
        <AskQuestionCard />
        <MeetingCard />
      </motion.div>

      {/* Enhanced Commit Log Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="space-y-4 sm:space-y-5"
      >
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Recent Commits
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Latest activity from your repository
          </p>
        </div>
        <CommitLog />
      </motion.div>
    </div>
  );
};

export default page;
