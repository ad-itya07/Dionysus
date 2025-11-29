"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useRefetch from "@/hooks/use-refetch";
import { api } from "@/trpc/react";
import { Info, Loader2 } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { motion } from "framer-motion";

type FormInput = {
  repoUrl: string;
  projectName: string;
  githubToken?: string;
};

const CreatePage = () => {
  const { register, handleSubmit, reset } = useForm<FormInput>();
  const createProject = api.project.createProject.useMutation();
  const checkCredits = api.project.checkCredits.useMutation();
  const refetch = useRefetch();

  const [projectId, setProjectId] = React.useState<string | null>(null);

  const { refetch: refetchCommits } = api.project.getCommits.useQuery(
    { projectId: projectId ?? "" },
    {
      enabled: false,
    },
  );

  function onSubmit(data: FormInput) {
    if (!!checkCredits.data) {
      createProject.mutate(
        {
          githubUrl: data.repoUrl,
          name: data.projectName,
          githubToken: data.githubToken,
        },
        {
          onSuccess: async (project) => {
            toast.success("Project created successfully");
            setProjectId(project.id);
            await new Promise((res) => setTimeout(res, 500)); // optional delay

            // Fetch commits (includes summaries)
            await refetchCommits();
            refetch();
            reset();
          },
          onError: (error) => {
            toast.error("Failed to create project");
          },
        },
      );
    } else {
      checkCredits.mutate({
        githubUrl: data.repoUrl,
        githubToken: data.githubToken,
      });
    }
  }

  const hasEnoughCredits = checkCredits?.data?.userCredits
    ? checkCredits.data.fileCount <= checkCredits.data.userCredits
    : true;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
        <p className="text-muted-foreground">
          Link your GitHub repository to get started with Dionysus
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="grid gap-8 lg:grid-cols-2 items-start"
      >
        <div className="hidden lg:block">
          <img
            src="/undraw_github.svg"
            className="h-80 w-auto mx-auto"
            alt="GitHub integration"
          />
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Name</label>
                <Input
                  {...register("projectName", { required: true })}
                  placeholder="My Awesome Project"
                  required
                  className="bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">GitHub Repository URL</label>
                <Input
                  {...register("repoUrl", { required: true })}
                  placeholder="https://github.com/username/repo"
                  type="url"
                  required
                  className="bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  GitHub Token <span className="text-muted-foreground">(Optional)</span>
                </label>
                <Input
                  {...register("githubToken")}
                  placeholder="ghp_xxxxxxxxxxxx"
                  type="password"
                  className="bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all"
                />
                <p className="text-xs text-muted-foreground">
                  Without a token, you may be limited to 60 credits per hour
                </p>
              </div>

              {!!checkCredits.data && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="space-y-1 text-sm">
                      <p className="text-foreground">
                        This repository contains{" "}
                        <strong className="text-primary">
                          {checkCredits.data?.fileCount}
                        </strong>{" "}
                        files
                      </p>
                      <p className="text-muted-foreground">
                        You have{" "}
                        <strong className="text-primary">
                          {checkCredits.data?.userCredits}
                        </strong>{" "}
                        credits remaining
                      </p>
                      {!hasEnoughCredits && (
                        <p className="text-destructive text-xs">
                          Insufficient credits. Please purchase more credits to continue.
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={
                  createProject.isPending ||
                  checkCredits.isPending ||
                  !hasEnoughCredits
                }
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-cyan-sm hover:shadow-glow-cyan transition-all"
                size="lg"
              >
                {createProject.isPending || checkCredits.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : !!checkCredits.data ? (
                  "Create Project"
                ) : (
                  "Check Credits"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CreatePage;
