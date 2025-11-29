"use client";

import useProject from "@/hooks/use-project";
import { api } from "@/trpc/react";
import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const TeamMembers = () => {
  const { projectId } = useProject();
  const { data: members } = api.project.getTeamMembers.useQuery(
    { projectId: projectId ?? "" },
    {
      enabled: !!projectId && projectId !== "",
      staleTime: 60000, // Cache for 1 minute
      refetchOnWindowFocus: false,
    },
  );

  if (!projectId || !members || members.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground mr-2">Team:</span>
      <TooltipProvider>
        {members.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative group">
                  <div className="rounded-full border-2 border-primary/30 bg-card p-0.5 transition-all group-hover:border-primary group-hover:shadow-glow-cyan-sm">
                    <Image
                      src={member.user.imageUrl || ""}
                      alt={member.user.firstName || "Team member"}
                      height={32}
                      width={32}
                      className="rounded-full"
                    />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-card border-border/50">
                <p className="text-sm">
                  {member.user.firstName} {member.user.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {member.user.emailAddress || "No email"}
                </p>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        ))}
      </TooltipProvider>
    </div>
  );
};

export default TeamMembers;
