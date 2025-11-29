"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/trpc/react";
import { VideoIcon, Clock, Loader2 } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

type Issue = {
  id: string;
  gist: string;
  headline: string;
  summary: string;
  start: string;
  end: string;
  createdAt: Date;
};

function IssueCard({
  issue,
}: {
  issue: Issue;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {issue.gist}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 mt-2">
              <Clock className="h-4 w-4" />
              {issue.createdAt.toLocaleDateString()} • {issue.start} - {issue.end}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <h4 className="font-medium text-foreground mb-2">Headline</h4>
              <p className="text-muted-foreground">{issue.headline}</p>
            </div>
            <div className="rounded-lg border-l-4 border-primary/50 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-sm text-primary mb-2">
                <Clock className="h-4 w-4" />
                {issue.start} - {issue.end}
              </div>
              <p className="text-foreground leading-relaxed italic">
                {issue.summary}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3 }}
      >
        <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/50 hover:shadow-glow-cyan-sm h-full">
          <CardHeader>
            <CardTitle className="text-lg">{issue.gist}</CardTitle>
            <CardDescription className="line-clamp-2">
              {issue.headline}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {issue.start} - {issue.end}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setOpen(true)}
                className="border-primary/30 hover:border-primary/50 hover:bg-primary/5"
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}

type Props = {
  meetingId: string;
};

const IssueList = ({ meetingId }: Props) => {
  // @ts-expect-error - API endpoint exists but type may not be fully defined
  const { data: meeting, isLoading } = api.project.getMeetingById.useQuery(
    { meetingId },
    {
      refetchInterval: 4000,
    },
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 p-12 text-center">
        <p className="text-muted-foreground">Meeting not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-4 p-6 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5"
      >
        <div className="rounded-lg bg-primary/20 p-3">
          <VideoIcon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <div className="text-sm text-muted-foreground mb-1">
            Meeting on {meeting.createdAt.toLocaleDateString()}
          </div>
          <h1 className="text-2xl font-bold text-foreground">{meeting.name}</h1>
        </div>
        {meeting.status === "PROCESSING" && (
          <div className="flex items-center gap-2 text-primary">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Processing...</span>
          </div>
        )}
      </motion.div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Issues</h2>
          <span className="text-sm text-muted-foreground">
            ({meeting.issues.length})
          </span>
        </div>
        {meeting.issues.length === 0 ? (
          <Card className="border-border/50 bg-card/50 p-12 text-center">
            <p className="text-muted-foreground">No issues found</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {meeting.issues.map((issue: Issue, index: number) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueList;
