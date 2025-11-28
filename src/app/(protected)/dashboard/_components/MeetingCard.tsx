"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpLeftFromSquare, Presentation, Upload } from "lucide-react";
import React from "react";
import { useDropzone } from "react-dropzone";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import { uploadFile } from "@/lib/cloudinary";
import { api } from "@/trpc/react";
import useProject from "@/hooks/use-project";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const MeetingCard = () => {
  const [isUploading, setIsUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const router = useRouter();
  const uploadMeeting = api.project.uploadMeeting.useMutation();
  const { project } = useProject();

  // MEETING AUDIO PROCESSING FUCNTION USING ASSEMBLY-AI
  const processMeeting = useMutation({
    mutationFn: async (data: {
      meetingUrl: string;
      meetingId: string;
      projectId: string;
    }) => {
      const { meetingUrl, meetingId, projectId } = data;
      // hitting the /api/process-meeting endpoint to process the meeting
      const response = await axios.post("/api/process-meeting", {
        meetingUrl,
        meetingId,
        projectId,
      });
      return response.data;
    },
  });

  // using react drop zone for audio upload and 
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a"],
    },
    multiple: false,
    maxSize: 50_000_000,
    onDrop: async (acceptedFiles) => {
      if (!project) return;

      setIsUploading(true);
      console.log(acceptedFiles);

      const file = acceptedFiles[0];
      if (!file) return;

      // after getting file, now upload it to cloudinary
      const downloadURL = (await uploadFile(
        file as File,
        setProgress,
      )) as string;
      uploadMeeting.mutate(
        {
          projectId: project.id,
          meetingUrl: downloadURL,
          name: file.name,
        },
        {
          onSuccess: (meeting) => {
            toast.success("Meeting uploaded successfully");
            router.push("/meetings");
            // after successfull-upload, now callng the processMeeting mutation 
            processMeeting.mutateAsync({
              meetingUrl: downloadURL,
              meetingId: meeting.id,
              projectId: project.id,
            });
          },
          onError: () => {
            toast.error("Failed to upload meeting");
          },
        },
      );

      setIsUploading(false);
    },
  });
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full"
    >
      <Card
        className="group relative overflow-hidden border-2 border-dashed border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-primary/5 hover:shadow-glow-cyan-sm cursor-pointer h-full flex flex-col"
        {...getRootProps()}
      >
        <CardContent className="flex flex-col items-center justify-center p-10 flex-1">
          {!project ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-primary/10 p-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Select a project
                </p>
                <p className="text-xs text-muted-foreground">
                  Choose a project from the sidebar to upload meetings
                </p>
              </div>
            </div>
          ) : !isUploading ? (
            <>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="rounded-full bg-primary/10 p-4 mb-4"
              >
                <Presentation className="h-8 w-8 text-primary" />
              </motion.div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Create a New Meeting
              </h3>
              <p className="text-center text-sm text-muted-foreground mb-6 max-w-xs">
                Analyse your meeting with Dionysus.
                <br />
                <span className="text-primary">Powered by AI.</span>
              </p>
              <Button
                disabled={isUploading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-cyan-sm hover:shadow-glow-cyan transition-all"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Meeting
                <input className="hidden" {...getInputProps()} />
              </Button>
            </>
          ) : null}

          {isUploading && (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <CircularProgressbar
                  value={progress}
                  text={`${progress}%`}
                  className="size-24"
                  styles={buildStyles({
                    pathColor: "hsl(188, 100%, 50%)",
                    textColor: "hsl(188, 100%, 50%)",
                    trailColor: "hsl(222, 47%, 18%)",
                  })}
                />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Uploading your meeting...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MeetingCard;
