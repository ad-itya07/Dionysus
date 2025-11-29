"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { FileCode } from "lucide-react";

type Props = {
  filesReferences: {
    fileName: string;
    sourceCode: string;
    summary: string;
  }[];
};

const CodeReferences = ({ filesReferences }: Props) => {
  if (filesReferences.length === 0) return null;

  const [tab, setTab] = React.useState(filesReferences[0]?.fileName);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <FileCode className="h-4 w-4 text-primary" />
        Code References
      </div>
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <ScrollArea className="w-full overflow-auto">
          <TabsList className="inline-flex h-10 items-center justify-start rounded-lg bg-secondary/50 p-1 w-full">
            {filesReferences.map((file) => (
              <TabsTrigger
                key={file.fileName}
                value={file.fileName}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow-cyan-sm",
                  "text-muted-foreground hover:text-foreground"
                )}
              >
                {file.fileName}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {filesReferences.map((file) => (
          <TabsContent
            key={file.fileName}
            value={file.fileName}
            className="mt-4 rounded-lg border border-border/50 overflow-hidden"
          >
            <ScrollArea className="max-h-[40vh] w-full">
              <SyntaxHighlighter
                language="typescript"
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  borderRadius: "0.5rem",
                  background: "hsl(222, 47%, 12%)",
                }}
                className="!bg-transparent"
              >
                {file.sourceCode}
              </SyntaxHighlighter>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default CodeReferences;
