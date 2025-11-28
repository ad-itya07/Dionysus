"use client";

import { SignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden p-4">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] bg-primary/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-6 left-6 z-10"
      >
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <Image src="/logo.png" alt="Dionysus" width={36} height={36} className="rounded-lg" />
            <div className="absolute inset-0 rounded-lg bg-primary/30 blur-md group-hover:bg-primary/40 transition-colors" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Dionysus
          </span>
        </Link>
      </motion.div>

      {/* Sign In Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="rounded-2xl border border-border/50 bg-card/90 backdrop-blur-xl shadow-glow-cyan-sm p-1">
          <div className="rounded-2xl bg-card/50 p-8">
            <SignIn
              appearance={{
                elements: {
                  rootBox: "mx-auto w-full",
                  card: "bg-transparent shadow-none border-0 p-0",
                  headerTitle: "text-2xl font-bold text-foreground mb-2",
                  headerSubtitle: "text-muted-foreground text-sm",
                  socialButtonsBlockButton: "border-border/50 bg-secondary/30 hover:bg-secondary/50 hover:border-primary/50 transition-all",
                  formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-cyan-sm hover:shadow-glow-cyan transition-all",
                  formFieldInput: "bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all",
                  footerActionLink: "text-primary hover:text-primary/80 transition-colors",
                  formFieldLabel: "text-foreground",
                  identityPreviewText: "text-foreground",
                  identityPreviewEditButton: "text-primary hover:text-primary/80",
                },
              }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
