"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserButton } from "@clerk/nextjs";
import AppSidebar from "./_components/AppSidebar";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type Props = {
  children: React.ReactNode;
};

const layout = ({ children }: Props) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex min-h-screen w-full flex-col">
        {/* Topbar */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="sticky top-0 z-50 flex items-center gap-4 border-b border-border/40 bg-card/80 backdrop-blur-xl px-6 py-4"
        >
          <SidebarTrigger className="transition-all hover:bg-secondary" />
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects, commits, meetings..."
              className="pl-10 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="ml-auto">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9",
                  userButtonPopoverCard: "bg-card border-border",
                },
              }}
            />
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="container mx-auto p-6"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </SidebarProvider>
  );
};

export default layout;
