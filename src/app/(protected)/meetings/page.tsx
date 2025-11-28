"use client";

import useProject from "@/hooks/use-project";
import { api } from "@/trpc/react";
import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import useRefetch from "@/hooks/use-refetch";
import MeetingCard from "../dashboard/_components/MeetingCard";
import EmptyProjectState from "../dashboard/_components/EmptyProjectState";
import { motion } from "framer-motion";
import { Calendar, FileText, Trash2, Eye, Loader2 } from "lucide-react";
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

const MeetingsPage = () => {
  const { project, projectId, projects } = useProject();
  const { data: meetings } = api.project.getMeetings.useQuery(
    { projectId: projectId ?? "" },
    {
      enabled: !!projectId,
      refetchInterval: 4000,
    },
  );
  const deleteMeeting = api.project.deleteMeeting.useMutation();
  const refetch = useRefetch();

  if (!project) {
    return (
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-2"
        >
          <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
          <p className="text-muted-foreground">
            Upload and analyze meeting recordings with AI
          </p>
        </motion.div>
        <EmptyProjectState hasProjects={(projects?.length ?? 0) > 0} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
        <p className="text-muted-foreground">
          Upload and analyze meeting recordings with AI
        </p>
      </motion.div>

      <MeetingCard />

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Your Meetings</h2>
          {meetings && meetings.length > 0 && (
            <span className="text-sm text-muted-foreground">
              ({meetings.length})
            </span>
          )}
        </div>

        {!meetings || meetings.length === 0 ? (
          <Card className="border-border/50 bg-card/50 p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No meetings yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Upload a meeting above to get started
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {meetings.map((meeting: any, index: number) => (
              <motion.div
                key={meeting.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/50 hover:shadow-glow-cyan-sm p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <Link
                            href={`/meetings/${meeting.id}`}
                            className="text-lg font-semibold text-foreground hover:text-primary transition-colors block"
                          >
                            {meeting.name}
                          </Link>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              {meeting.createdAt.toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <FileText className="h-4 w-4" />
                              {meeting.issues.length} issue
                              {meeting.issues.length !== 1 ? "s" : ""}
                            </div>
                          </div>
                        </div>
                        {meeting.status === "PROCESSING" && (
                          <Badge className="bg-primary/20 text-primary border-primary/30 flex items-center gap-1.5">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Processing
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/meetings/${meeting.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-primary/30 hover:border-primary/50 hover:bg-primary/5"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </Link>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="border-destructive/50 hover:bg-destructive/90"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border/50">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this meeting? This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                deleteMeeting.mutate(
                                  { meetingId: meeting.id },
                                  {
                                    onSuccess: () => {
                                      toast.success(
                                        "Meeting deleted successfully"
                                      );
                                      refetch();
                                    },
                                  },
                                )
                              }
                              disabled={deleteMeeting.isPending}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              {deleteMeeting.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                "Delete"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingsPage;
