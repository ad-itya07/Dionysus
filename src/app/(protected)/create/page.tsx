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
    <div className="max-w-5xl mx-auto space-y-8 sm:space-y-10 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-3"
      >
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
          Create New Project
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl">
          Link your GitHub repository to get started with Dionysus and unlock AI-powered insights
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="grid gap-8 lg:grid-cols-2 items-start"
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="hidden lg:flex items-center justify-center"
        >
          <div className="relative">
            <img
              src="/undraw_github.svg"
              className="h-96 w-auto"
              alt="GitHub integration illustration"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl blur-2xl -z-10" />
          </div>
        </motion.div>

        <Card className="border-border/70 bg-card/80 backdrop-blur-sm shadow-lg">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl">Project Details</CardTitle>
            <p className="text-sm text-muted-foreground">
              Fill in the information below to connect your repository
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="projectName" className="text-sm font-semibold text-foreground">
                  Project Name
                </label>
                <Input
                  id="projectName"
                  {...register("projectName", { required: true })}
                  placeholder="My Awesome Project"
                  required
                  className="bg-secondary/70 border-border/70 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all h-11"
                  aria-label="Project name"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="repoUrl" className="text-sm font-semibold text-foreground">
                  GitHub Repository URL
                </label>
                <Input
                  id="repoUrl"
                  {...register("repoUrl", { required: true })}
                  placeholder="https://github.com/username/repo"
                  type="url"
                  required
                  className="bg-secondary/70 border-border/70 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all h-11"
                  aria-label="GitHub repository URL"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="githubToken" className="text-sm font-semibold text-foreground">
                  GitHub Token <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <Input
                  id="githubToken"
                  {...register("githubToken")}
                  placeholder="ghp_xxxxxxxxxxxx"
                  type="password"
                  className="bg-secondary/70 border-border/70 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all h-11"
                  aria-label="GitHub personal access token (optional)"
                />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Without a token, you may be limited to 60 requests per hour
                </p>
              </div>

              {!!checkCredits.data && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                  className="rounded-xl border border-primary/40 bg-gradient-to-br from-primary/10 to-primary/5 p-4 sm:p-5 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/20 p-2 flex-shrink-0">
                      <Info className="h-4 w-4 text-primary" aria-hidden="true" />
                    </div>
                    <div className="space-y-2 text-sm flex-1">
                      <p className="text-foreground font-medium">
                        This repository contains{" "}
                        <strong className="text-primary font-bold">
                          {checkCredits.data?.fileCount}
                        </strong>{" "}
                        files
                      </p>
                      <p className="text-muted-foreground">
                        You have{" "}
                        <strong className="text-primary font-semibold">
                          {checkCredits.data?.userCredits}
                        </strong>{" "}
                        credits remaining
                      </p>
                      {!hasEnoughCredits && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-destructive text-xs font-medium bg-destructive/10 p-2 rounded-lg border border-destructive/20"
                        >
                          Insufficient credits. Please purchase more credits to continue.
                        </motion.p>
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
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-cyan-sm hover:shadow-glow-cyan transition-all h-12 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                size="lg"
                aria-label={createProject.isPending || checkCredits.isPending ? "Processing" : !!checkCredits.data ? "Create project" : "Check credits"}
              >
                {createProject.isPending || checkCredits.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
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
