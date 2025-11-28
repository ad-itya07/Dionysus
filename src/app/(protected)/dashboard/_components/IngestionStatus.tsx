"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IngestionStatus as IngestionStatusEnum } from "@prisma/client";
import { AlertCircle, CheckCircle2, Loader2, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface IngestionStatusProps {
  status: IngestionStatusEnum;
  progress: number;
  filesProcessed?: number;
  filesTotal?: number;
  commitsProcessed?: number;
  commitsTotal?: number;
  errorMessage?: string | null;
}

const IngestionStatus = ({
  status,
  progress,
  filesProcessed,
  filesTotal,
  commitsProcessed,
  commitsTotal,
  errorMessage,
}: IngestionStatusProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case IngestionStatusEnum.PENDING:
        return {
          label: "Pending",
          icon: Clock,
          color: "bg-muted text-muted-foreground",
          showProgress: false,
        };
      case IngestionStatusEnum.IN_PROGRESS:
        return {
          label: "Processing...",
          icon: Loader2,
          color: "bg-primary/20 text-primary border-primary/30",
          showProgress: true,
        };
      case IngestionStatusEnum.READY:
        return {
          label: "Ready",
          icon: CheckCircle2,
          color: "bg-green-500/20 text-green-400 border-green-500/30",
          showProgress: false,
        };
      case IngestionStatusEnum.COMPLETED:
        return {
          label: "Completed",
          icon: CheckCircle2,
          color: "bg-green-500/20 text-green-400 border-green-500/30",
          showProgress: false,
        };
      case IngestionStatusEnum.FAILED:
        return {
          label: "Failed",
          icon: AlertCircle,
          color: "bg-destructive/20 text-destructive border-destructive/30",
          showProgress: false,
        };
      default:
        return {
          label: "Unknown",
          icon: Clock,
          color: "bg-muted text-muted-foreground",
          showProgress: false,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (status === IngestionStatusEnum.COMPLETED && progress === 100) {
    return null; // Don't show banner when fully completed
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Alert
        className={`border ${config.color} ${
          status === IngestionStatusEnum.IN_PROGRESS ? "animate-pulse" : ""
        }`}
      >
        <div className="flex items-start gap-3">
          <Icon
            className={`h-5 w-5 mt-0.5 ${
              status === IngestionStatusEnum.IN_PROGRESS ? "animate-spin" : ""
            }`}
          />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <AlertDescription className="font-medium">
                {config.label}
              </AlertDescription>
              <Badge variant="outline" className={config.color}>
                {progress}%
              </Badge>
            </div>

            {config.showProgress && (
              <div className="space-y-1">
                <Progress value={progress} className="h-2" />
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {filesTotal && filesProcessed !== undefined && (
                    <span>
                      Files: {filesProcessed}/{filesTotal}
                    </span>
                  )}
                  {commitsTotal && commitsProcessed !== undefined && (
                    <span>
                      Commits: {commitsProcessed}/{commitsTotal}
                    </span>
                  )}
                </div>
              </div>
            )}

            {status === IngestionStatusEnum.READY && (
              <p className="text-sm text-muted-foreground">
                Your project is ready! You can now use Q&A and other features.
                Additional files are being processed in the background.
              </p>
            )}

            {status === IngestionStatusEnum.FAILED && errorMessage && (
              <p className="text-sm text-destructive mt-1">{errorMessage}</p>
            )}
          </div>
        </div>
      </Alert>
    </motion.div>
  );
};

export default IngestionStatus;

