"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import useProject from "@/hooks/use-project";
import { api } from "@/trpc/react";
import React from "react";
import MDEditor from "@uiw/react-md-editor";
import { ScrollArea } from "@/components/ui/scroll-area";
import AskQuestionCrad from "../dashboard/_components/AskQuestionCard";
import CodeReferences from "../dashboard/_components/CodeReferences";
import { motion } from "framer-motion";
import { MessageSquare, Calendar } from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/card";

const QaPage = () => {
  const { projectId } = useProject();
  const { data: questions } = api.project.getQuestions.useQuery({ projectId });
  const [questionIndex, setQuestionIndex] = React.useState(0);
  const question = questions?.[questionIndex];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold tracking-tight">Q&A</h1>
        <p className="text-muted-foreground">
          Ask questions and view saved answers about your project
        </p>
      </motion.div>

      <AskQuestionCrad />

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Saved Questions</h2>
          {questions && questions.length > 0 && (
            <span className="text-sm text-muted-foreground">
              ({questions.length})
            </span>
          )}
        </div>

        {!questions || questions.length === 0 ? (
          <Card className="border-border/50 bg-card/50 p-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No saved questions yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Ask a question above to get started
            </p>
          </Card>
        ) : (
          <Sheet>
            <div className="grid gap-4">
              {questions.map((q, index) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <SheetTrigger asChild>
                    <Card
                      className="group cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/50 hover:shadow-glow-cyan-sm p-4"
                      onClick={() => setQuestionIndex(index)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <Image
                            className="rounded-full border-2 border-primary/30"
                            height={40}
                            width={40}
                            src={q.user.imageUrl ?? ""}
                            alt={q.user.firstName ?? "User"}
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-base font-medium text-foreground line-clamp-2">
                              {q.question}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                              <Calendar className="h-3 w-3" />
                              {q.createdAt.toLocaleDateString()}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {q.answer}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </SheetTrigger>
                </motion.div>
              ))}
            </div>

            {question && (
              <SheetContent className="sm:max-w-[85vw] bg-card/95 backdrop-blur-xl border-border/50">
                <SheetHeader className="border-b border-border/50 pb-4 mb-4">
                  <SheetTitle className="text-xl font-semibold">
                    {question.question}
                  </SheetTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <Calendar className="h-4 w-4" />
                    {question.createdAt.toLocaleDateString()}
                  </div>
                </SheetHeader>
                <div className="space-y-6">
                  <div data-color-mode="dark">
                    <ScrollArea className="max-h-[50vh] pr-4">
                      <MDEditor.Markdown source={question.answer} />
                    </ScrollArea>
                  </div>

                  {question.filesReferences &&
                    question.filesReferences.length > 0 && (
                      <div className="border-t border-border/50 pt-6">
                        <CodeReferences
                          filesReferences={question.filesReferences}
                        />
                      </div>
                    )}
                </div>
              </SheetContent>
            )}
          </Sheet>
        )}
      </div>
    </div>
  );
};

export default QaPage;
