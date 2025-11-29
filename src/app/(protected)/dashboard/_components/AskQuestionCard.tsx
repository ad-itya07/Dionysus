"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import useProject from "@/hooks/use-project";
import React from "react";
import { readStreamableValue } from "ai/rsc";
import MDEditor from "@uiw/react-md-editor";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import useRefetch from "@/hooks/use-refetch";
import { askQuestion } from "../actions";
import CodeReferences from "./CodeReferences";
import { motion } from "framer-motion";
import { Bot, Save, Loader2 } from "lucide-react";

const AskQuestionCrad = () => {
  const { project, projectId } = useProject();
  const [question, setQuestion] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [filesReferences, setFilesReferences] = React.useState<
    { fileName: string; sourceCode: string; summary: string }[]
  >([]);
  const [answer, setAnswer] = React.useState("");
  const saveAnswer = api.project.saveAnswer.useMutation();
  const refetch = useRefetch();
  const { data: ingestionStatus } = api.project.getIngestionStatus.useQuery(
    { projectId: projectId ?? "" },
    {
      enabled: !!projectId && projectId !== "",
      staleTime: 10000, // Cache for 10 seconds
      refetchOnWindowFocus: false,
    },
  );

  const canUseQA = ingestionStatus?.canUseQA ?? false;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setAnswer("");
    setFilesReferences([]);
    e.preventDefault();
    if (!project?.id) return;

    setLoading(true);
    setOpen(true);

    const { output, filesReferences } = await askQuestion(question, project.id);
    setFilesReferences(filesReferences);

    for await (const delta of readStreamableValue(output)) {
      if (delta) {
        setAnswer((ans) => ans + delta);
      }
    }

    setLoading(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col bg-card border-border/50 p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b border-border/50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                AI Response
              </DialogTitle>
              <Button
                variant="outline"
                size="sm"
                disabled={saveAnswer.isPending || !answer}
                onClick={() => {
                  saveAnswer.mutate(
                    {
                      projectId: project!.id,
                      question,
                      answer,
                      filesReferences,
                    },
                    {
                      onSuccess: () => {
                        toast.success("Answer saved!");
                        refetch();
                      },
                      onError: () => {
                        toast.error("Failed to save answer!");
                      },
                    },
                  );
                }}
                className="h-8 text-xs"
              >
                {saveAnswer.isPending ? (
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                ) : (
                  <Save className="h-3 w-3 mr-1.5" />
                )}
                Save
              </Button>
            </div>
          </DialogHeader>
          
          {/* Main scrollable container for both sections */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
            <div className="flex flex-col">
              {/* Response Section */}
              <div className="border-b border-border/50">
                <div className="px-6 py-3 bg-secondary/20 border-b border-border/30">
                  <h3 className="text-sm font-semibold text-foreground">Response</h3>
                </div>
                <ScrollArea className="h-[40vh]">
                  <div className="px-6 py-4" data-color-mode="dark">
                    {loading && !answer ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="prose prose-invert prose-sm max-w-none dark:prose-invert">
                        <MDEditor.Markdown 
                          source={answer || "Waiting for response..."}
                          style={{ 
                            backgroundColor: 'transparent',
                            color: 'inherit',
                          }}
                        />
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Code References Section
              {filesReferences.length > 0 && (
                <div className="border-b border-border/50 bg-black">
                  <div className="px-6 py-3 bg-secondary/40 border-b border-border/30">
                    <h3 className="text-sm font-semibold text-foreground">Code References</h3>
                  </div>
                  <ScrollArea className="h-[30vh]">
                    <div className="px-6 py-4 bg-secondary/30">
                      <CodeReferences filesReferences={filesReferences} />
                    </div>
                  </ScrollArea>
                </div>
              )} */}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-6 py-3 border-t border-border/50 flex-shrink-0 bg-secondary/30">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setOpen(false);
              }}
              className="h-8"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="h-full"
      >
        <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-glow-cyan-sm h-full flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl">Ask a Question</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {!canUseQA ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">
                  Processing Repository
                </p>
                <p className="text-xs text-muted-foreground">
                  Q&A will be available once initial processing is complete
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4 flex-1 flex flex-col">
                <Textarea
                  placeholder="Which file should I edit to change the home page?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="flex-1 min-h-[100px] bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all resize-none"
                  disabled={loading}
                />
                <Button
                  type="submit"
                  disabled={loading || !question.trim()}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-cyan-sm hover:shadow-glow-cyan transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Bot className="mr-2 h-4 w-4" />
                      Ask Dionysus
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

export default AskQuestionCrad;
