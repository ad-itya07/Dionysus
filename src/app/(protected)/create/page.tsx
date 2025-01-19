"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useRefetch from "@/hooks/use-refetch";
import { api } from "@/trpc/react";
import { FormInput } from "@/types/FormInput";
import { revalidatePath } from "next/cache";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {};

const page = ({}: Props) => {
  const { register, handleSubmit, reset } = useForm<FormInput>();
  const  createProject = api.project.createProject.useMutation();
  const refetch = useRefetch();

  const onSubmit = (data: FormInput) => {
    createProject.mutate({
      githubUrl: data.repoUrl,
      githubToken: data.githubToken,
      name: data.projectName
    }, 
    {
      onSuccess: () => {
        refetch();
        toast.success('Project created successfully');
      },
      onError: () => {
        toast.error('Failed to create project');
      }
    });
    return true;
  };

  return (
    <div className="flex h-full items-center justify-center gap-12">
      <img src="/undraw_developer.svg" className="h-56 w-auto" />
      <div>
        <div>
          <h1 className="text-2xl font-semibold">
            Link your Github Repository
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter the URL of your repository to link it to Dionysus
          </p>
        </div>

        <div className="h4"></div>

        <div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Input
              {...register("projectName", { required: true })}
              placeholder="Project Name"
              required
            />

            <div className="h-2"></div>

            <Input
              {...register("repoUrl", { required: true })}
              placeholder="Github URL"
              type="url"
              required
            />

            <div className="h-2"></div>

            <Input
              {...register("githubToken")}
              placeholder="Github Token (optional)"
            />

            <div className="h-4"></div>

            <Button type="submit" disabled={createProject.isPending}>
                Create Project
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default page;
