"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import useProject from "@/hooks/use-project";
import React from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { UserPlus, Copy, Check } from "lucide-react";

const InviteButton = () => {
  const { projectId } = useProject();
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  if (!projectId) {
    return null;
  }

  const inviteLink = `${window.location.origin}/join/${projectId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Invite Team Members
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Share this link with your team members to invite them to the project
            </p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={inviteLink}
                className="bg-secondary/50 border-border/50 font-mono text-sm"
                onClick={handleCopy}
              />
              <Button
                onClick={handleCopy}
                size="icon"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-cyan-sm"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Button
        size="sm"
        onClick={() => setOpen(true)}
        className="border-primary/30 hover:border-primary/50 hover:bg-primary/5"
        variant="outline"
      >
        <UserPlus className="mr-2 h-4 w-4" />
        Invite Members
      </Button>
    </>
  );
};

export default InviteButton;
