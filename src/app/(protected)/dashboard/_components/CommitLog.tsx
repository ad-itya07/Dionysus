"use client";

import useProject from "@/hooks/use-project";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";

type Props = {};

const CommitLog = ({}: Props) => {
  const { projectId, project } = useProject();
  const { data: ingestionStatus } = api.project.getIngestionStatus.useQuery(
    { projectId: projectId ?? "" },
    { enabled: !!projectId && projectId !== "" },
  );
  
  const { data: commits } = api.project.getCommits.useQuery(
    { projectId: projectId ?? "" },
    {
      enabled: !!projectId && projectId !== "",
      staleTime: 10000,
      refetchOnWindowFocus: true,
      refetchInterval: (query) => {
        // Poll every 10 seconds if ingestion is in progress
        if (ingestionStatus?.ingestionStatus === "IN_PROGRESS") {
          return 10000;
        }
        return false; // Don't poll if completed
      },
    },
  );

  if (!projectId) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 p-8 text-center">
        <p className="text-sm text-muted-foreground">Select a project to view commits</p>
      </div>
    );
  }

  if (!commits || commits.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 p-12 text-center">
        <p className="text-muted-foreground">No commits found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {commits.slice(0, 5).map((commit, commitIdx) => (
        <motion.div
          key={commit.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: commitIdx * 0.05, duration: 0.4 }}
          className="relative flex items-start gap-4 group"
        >
          {/* Timeline */}
          <div className="relative flex flex-col items-center">
            <div className="relative z-10 rounded-full border-2 border-primary/30 bg-card p-1.5 group-hover:border-primary group-hover:shadow-glow-cyan-sm transition-all">
              <Image
                src={commit.commitAuthorAvatar}
                alt="commit avatar"
                className="h-8 w-8 rounded-full"
                width={32}
                height={32}
              />
            </div>
            {commitIdx !== commits.length - 1 && (
              <div className="absolute top-10 left-1/2 w-0.5 h-full -translate-x-1/2 bg-gradient-to-b from-primary/30 to-transparent" />
            )}
          </div>

          {/* Commit Card */}
          <div className="flex-1 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 transition-all group-hover:border-primary/50 group-hover:shadow-glow-cyan-sm">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <Link
                  target="_blank"
                  href={`${project?.githubUrl}/commits/${commit.commitHash}`}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group/link"
                >
                  <span className="font-medium text-foreground">
                    {commit.commitAuthorName}
                  </span>
                  <span>committed</span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                </Link>
              </div>
            </div>

            <h4 className="font-semibold text-foreground mb-2">
              {commit.commitMessage}
            </h4>
            {commit.summary && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {commit.summary}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default CommitLog;
