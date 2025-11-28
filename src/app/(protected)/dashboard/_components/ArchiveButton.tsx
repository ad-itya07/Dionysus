"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import useProject from "@/hooks/use-project";
import useRefetch from "@/hooks/use-refetch";
import { api } from "@/trpc/react";
import React from "react";
import { toast } from "sonner";
import { Archive, Loader2 } from "lucide-react";

const ArchiveButton = () => {
  const archiveProject = api.project.archiveProject.useMutation();
  const { projectId } = useProject();
  const refetch = useRefetch();
  const [open, setOpen] = React.useState(false);

  const handleArchive = () => {
    archiveProject.mutate(
      { projectId: projectId },
      {
        onSuccess: () => {
          toast.success("Project archived successfully");
          refetch();
          setOpen(false);
        },
        onError: () => {
          toast.error("Failed to archive project");
        },
      },
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="destructive"
          className="border-destructive/50 hover:bg-destructive/90"
        >
          <Archive className="mr-2 h-4 w-4" />
          Archive
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border/50">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold">
            Archive Project
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Are you sure you want to archive this project? This action can be
            undone later, but the project will be hidden from your active
            projects list.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={archiveProject.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleArchive}
            disabled={archiveProject.isPending}
            className="bg-destructive hover:bg-destructive/90"
          >
            {archiveProject.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Archiving...
              </>
            ) : (
              "Archive Project"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ArchiveButton;
