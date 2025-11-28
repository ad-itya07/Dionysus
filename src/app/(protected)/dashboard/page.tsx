"use client";

import useProject from "@/hooks/use-project";
import { ExternalLink, Github } from "lucide-react";
import Link from "next/link";
import CommitLog from "./_components/CommitLog";
import AskQuestionCard from "./_components/AskQuestionCard";
import MeetingCard from "./_components/MeetingCard";
import ArchiveButton from "./_components/ArchiveButton";
import TeamMembers from "./_components/TeamMembers";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const InviteButton = dynamic(() => import("./_components/InviteButton"), {
  ssr: false,
});

type Props = {};

const page = ({}: Props) => {
  const { project } = useProject();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-4"
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Overview of your project activity and insights
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TeamMembers />
            <InviteButton />
            <ArchiveButton />
          </div>
        </div>

        {/* GitHub Link Card */}
        {project?.githubUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="group relative overflow-hidden rounded-lg border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-3 shadow-glow-cyan-sm transition-all hover:border-primary/40 hover:shadow-glow-cyan"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/20 p-1.5">
                <Github className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">
                  Linked Repository
                </p>
                <Link
                  href={project.githubUrl}
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors mt-0.5 truncate"
                  target="_blank"
                >
                  <span className="truncate">{project.githubUrl}</span>
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Quick Actions Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch"
      >
        <AskQuestionCard />
        <MeetingCard />
      </motion.div>

      {/* Commit Log */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="space-y-3"
      >
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Recent Commits
          </h2>
          <p className="text-muted-foreground text-xs mt-0.5">
            Latest activity from your repository
          </p>
        </div>
        <CommitLog />
      </motion.div>
    </div>
  );
};

export default page;
