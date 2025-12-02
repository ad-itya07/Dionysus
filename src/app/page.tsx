"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Github, Users, FileAudio, Sparkles, ArrowRight, Zap, Shield, TrendingUp } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Enhanced Animated Background Gradient */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-primary/5" />
        <motion.div
          className="absolute top-0 left-1/4 h-[600px] w-[600px] bg-primary/10 rounded-full blur-3xl"
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
          className="absolute bottom-0 right-1/4 h-[600px] w-[600px] bg-primary/10 rounded-full blur-3xl"
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

      <header className="sticky top-0 z-50 border-b border-border/40 bg-card/90 backdrop-blur-xl supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
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
          <motion.nav
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
            aria-label="Main navigation"
          >
            <Link href="/sign-in">
              <Button 
                variant="ghost" 
                className="hover:bg-secondary/80 transition-colors"
                aria-label="Sign in to your account"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-cyan-sm hover:shadow-glow-cyan transition-all"
                aria-label="Get started with Dionysus"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          </motion.nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Enhanced Hero Section */}
        <section className="relative w-full py-16 sm:py-24 md:py-32 lg:py-40 overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              style={{ opacity, scale }}
              className="flex flex-col items-center space-y-10 text-center"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-8 max-w-4xl"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-primary shadow-sm"
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  <span>AI-Powered GitHub Assistant</span>
                </motion.div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-tight">
                  Revolutionize Your{" "}
                  <span className="relative inline-block">
                    <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                      GitHub Workflow
                    </span>
                    <motion.div
                      className="absolute -bottom-2 left-0 right-0 h-3 bg-primary/20 rounded-full -z-10"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.8, duration: 0.6 }}
                    />
                  </span>{" "}
                  with AI
                </h1>
                <p className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
                  Dionysus: Your AI-powered GitHub companion for seamless
                  collaboration, intelligent code analysis, and actionable meeting insights.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
              >
                <Link href="/sign-up">
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-cyan-sm hover:shadow-glow-cyan transition-all text-base sm:text-lg px-8 py-6 h-auto group"
                    aria-label="Get started with Dionysus for free"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-border/70 hover:border-primary/50 hover:bg-primary/5 text-base sm:text-lg px-8 py-6 h-auto transition-all"
                    aria-label="Sign in to your account"
                  >
                    Sign In
                  </Button>
                </Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary/70" aria-hidden="true" />
                  <span>No credit card required</span>
                </div>
                <div className="hidden sm:block w-1 h-1 rounded-full bg-muted-foreground/50" aria-hidden="true" />
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary/70" aria-hidden="true" />
                  <span>Start in seconds</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Enhanced Features Section */}
        <section className="w-full py-20 md:py-32 lg:py-40 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="mb-16 sm:mb-20 text-center"
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
                Powerful Features
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground text-lg sm:text-xl">
                Everything you need to supercharge your GitHub workflow and elevate your development experience
              </p>
            </motion.div>
            <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
              {[
                {
                  icon: Github,
                  title: "GitHub Integration",
                  description:
                    "Seamlessly connect your GitHub repositories and access powerful AI-driven insights and analytics. Understand your codebase like never before.",
                  gradient: "from-blue-500/20 to-cyan-500/20",
                },
                {
                  icon: Users,
                  title: "Team Collaboration",
                  description:
                    "Invite team members, share projects, and work together efficiently on a unified platform. Real-time collaboration made simple.",
                  gradient: "from-purple-500/20 to-pink-500/20",
                },
                {
                  icon: FileAudio,
                  title: "Meeting Insights",
                  description:
                    "Upload audio files from meetings and get AI-generated transcripts, summaries, and actionable timestamps. Never miss important details.",
                  gradient: "from-green-500/20 to-emerald-500/20",
                },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.15, duration: 0.6 }}
                  whileHover={{ y: -8 }}
                >
                  <Card className="group relative overflow-hidden border-border/70 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-glow-cyan-sm h-full">
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    <CardHeader className="relative z-10">
                      <motion.div
                        className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <feature.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                      </motion.div>
                      <CardTitle className="text-xl sm:text-2xl mb-2">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced CTA Section */}
        <section className="w-full py-20 md:py-32 lg:py-40 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="mx-auto max-w-4xl relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-3xl -z-10" />
              <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-card/90 via-card/80 to-card/70 backdrop-blur-xl p-8 sm:p-12 md:p-16 text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-10" />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="relative z-10"
                >
                  <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                    Ready to Transform Your GitHub Experience?
                  </h2>
                  <p className="mb-8 sm:mb-10 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    Join Dionysus today and unlock the power of AI for your GitHub
                    projects. Start building smarter, faster, and more efficiently.
                  </p>
                  <Link href="/sign-up">
                    <Button
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-cyan-sm hover:shadow-glow-cyan transition-all text-base sm:text-lg px-8 py-6 h-auto group"
                      aria-label="Get started with Dionysus for free"
                    >
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 bg-card/80 backdrop-blur-sm mt-auto">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-8 sm:py-10 sm:flex-row">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} Dionysus. All rights reserved.
          </p>
          <nav className="flex gap-6" aria-label="Footer navigation">
            <Link
              className="text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded"
              href="#"
              aria-label="Terms of Service"
            >
              Terms of Service
            </Link>
            <Link
              className="text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded"
              href="#"
              aria-label="Privacy Policy"
            >
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
