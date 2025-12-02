"use client";

import { SignUp } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden p-4 sm:p-6">
      {/* Enhanced Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-primary/5" />
        <motion.div
          className="absolute top-1/4 left-1/4 h-[600px] w-[600px] bg-primary/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 h-[600px] w-[600px] bg-primary/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.03),transparent_50%)]" />
      </div>

      {/* Enhanced Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-6 left-4 sm:left-6 z-10"
      >
        <Link href="/" className="flex items-center gap-3 group" aria-label="Dionysus Home">
          <div className="relative">
            <Image 
              src="/logo.png" 
              alt="Dionysus Logo" 
              width={36} 
              height={36} 
              className="rounded-lg transition-transform group-hover:scale-105" 
              priority
            />
            <div className="absolute inset-0 rounded-lg bg-primary/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
            Dionysus
          </span>
        </Link>
      </motion.div>

      {/* Enhanced Sign Up Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md z-10"
      >
        <div className="relative">
          {/* Glow effect behind card */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-2xl -z-10 opacity-50" />
          
          <div className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-2xl shadow-2xl p-1 relative overflow-hidden">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            
            <div className="rounded-2xl bg-card/60 backdrop-blur-xl p-6 sm:p-8 relative">
              <SignUp
                appearance={{
                  variables: {
                  colorPrimary: "hsl(188, 100%, 50%)",
                  colorBackground: "hsl(222, 47%, 15%)",
                  colorInputBackground: "hsl(222, 47%, 18%)",
                  colorInputText: "hsl(0, 0%, 98%)",
                  colorText: "hsl(0, 0%, 98%)",
                  colorTextSecondary: "hsl(0, 0%, 70%)",
                  colorDanger: "hsl(0, 84.2%, 60.2%)",
                  borderRadius: "0.75rem",
                },
                elements: {
                  rootBox: "mx-auto w-full",
                  card: "bg-transparent shadow-none border-0 p-0",
                  headerTitle: "text-2xl sm:text-3xl font-bold text-foreground mb-2 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent",
                  headerSubtitle: "text-muted-foreground text-sm sm:text-base mb-6 leading-relaxed",
                  socialButtonsBlockButton: "border-border/70 bg-secondary/60 hover:bg-secondary/80 hover:border-primary/50 text-foreground transition-all duration-300 shadow-sm hover:shadow-md",
                  socialButtonsBlockButtonText: "text-foreground font-medium",
                  socialButtonsBlockButtonArrow: "text-foreground",
                  dividerLine: "bg-border/50",
                  dividerText: "text-muted-foreground text-xs",
                  formFieldLabel: "text-foreground font-semibold text-sm",
                  formFieldInput: "bg-secondary/60 border-border/60 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-200 h-11",
                  formFieldErrorText: "text-destructive text-sm font-medium",
                  formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-cyan-sm hover:shadow-glow-cyan transition-all font-semibold h-11 text-base",
                  formButtonReset: "text-muted-foreground hover:text-foreground transition-colors",
                  footerActionLink: "text-primary hover:text-primary/80 transition-colors font-medium",
                  footerActionText: "text-muted-foreground text-sm",
                  identityPreviewText: "text-foreground",
                  identityPreviewEditButton: "text-primary hover:text-primary/80",
                  formResendCodeLink: "text-primary hover:text-primary/80 font-medium",
                  otpCodeFieldInput: "bg-secondary/60 border-border/60 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/30",
                  alertText: "text-foreground",
                  alertTextDanger: "text-destructive font-medium",
                  formFieldSuccessText: "text-primary font-medium",
                },
              }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
