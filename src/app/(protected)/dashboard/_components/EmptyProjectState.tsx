"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderPlus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface EmptyProjectStateProps {
  hasProjects: boolean;
}

const EmptyProjectState = ({ hasProjects }: EmptyProjectStateProps) => {
  if (hasProjects) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-border/50 bg-card/50 p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-primary/10 p-4">
              <FolderPlus className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Select a project
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Choose a project from the sidebar to view its dashboard, commits, and insights
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-border/50 bg-card/50 p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-primary/10 p-4">
            <FolderPlus className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              You don't have any projects yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Create your first project to start analyzing your GitHub repositories with AI-powered insights
            </p>
          </div>
          <Link href="/create">
            <Button className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-cyan-sm hover:shadow-glow-cyan transition-all">
              <FolderPlus className="h-4 w-4 mr-2" />
              Create Your First Project
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </Card>
    </motion.div>
  );
};

export default EmptyProjectState;

