"use client";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import useProject from "@/hooks/use-project";
import { cn } from "@/lib/utils";
import {
  Bot,
  CreditCard,
  LayoutDashboard,
  Plus,
  Presentation,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { IngestionStatus } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

type Props = {};

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Q&A",
    url: "/qa",
    icon: Bot,
  },
  {
    title: "Meetings",
    url: "/meetings",
    icon: Presentation,
  },
  {
    title: "Billing",
    url: "/billing",
    icon: CreditCard,
  },
];

const StatusBadge = ({ status }: { status: IngestionStatus }) => {
  const config = {
    [IngestionStatus.PENDING]: {
      icon: Clock,
      label: "Pending",
      className: "bg-muted text-muted-foreground border-muted-foreground/20",
    },
    [IngestionStatus.IN_PROGRESS]: {
      icon: Loader2,
      label: "Processing",
      className: "bg-primary/20 text-primary border-primary/30",
    },
    [IngestionStatus.READY]: {
      icon: CheckCircle2,
      label: "Ready",
      className: "bg-green-500/20 text-green-400 border-green-500/30",
    },
    [IngestionStatus.COMPLETED]: {
      icon: CheckCircle2,
      label: "Complete",
      className: "bg-green-500/20 text-green-400 border-green-500/30",
    },
    [IngestionStatus.FAILED]: {
      icon: AlertCircle,
      label: "Failed",
      className: "bg-destructive/20 text-destructive border-destructive/30",
    },
  };

  const { icon: Icon, label, className } = config[status] || config[IngestionStatus.PENDING];

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 text-xs px-1.5 gap-1",
        className,
        status === IngestionStatus.IN_PROGRESS && "animate-pulse",
      )}
    >
      <Icon
        className={cn(
          "h-3 w-3",
          status === IngestionStatus.IN_PROGRESS && "animate-spin",
        )}
      />
      <span className="hidden sm:inline">{label}</span>
    </Badge>
  );
};

const AppSidebar = ({}: Props) => {
  const pathname = usePathname();
  const { projects, projectId, setProjectId, project } = useProject();
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader className="border-b border-border/40">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3 px-2 py-4"
        >
          <div className="relative">
            <Image
              src="/logo.png"
              alt="logo"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <div className="absolute inset-0 rounded-lg bg-primary/20 blur-md" />
          </div>
          {open && (
            <div className="flex-1 min-w-0">
              {project ? (
                <>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {project.name}
                    </p>
                    {project.ingestionStatus && (
                      <StatusBadge status={project.ingestionStatus} />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    Active Project
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-muted-foreground truncate">
                    Select a project...
                  </p>
                  <p className="text-xs text-muted-foreground/70 truncate">
                    {projects && projects.length === 0
                      ? "No projects yet"
                      : "Choose a project to get started"}
                  </p>
                </>
              )}
            </div>
          )}
        </motion.div>
      </SidebarHeader>
      <SidebarContent className="gap-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item, index) => {
                const isActive = pathname === item.url;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        className={cn(
                          "group relative transition-all duration-200",
                          isActive &&
                            "bg-primary/10 text-primary border-l-2 border-primary"
                        )}
                      >
                        <Link href={item.url} className="flex items-center gap-3">
                          <item.icon
                            className={cn(
                              "h-5 w-5 transition-colors",
                              isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                            )}
                          />
                          <span className="font-medium">{item.title}</span>
                          {isActive && (
                            <motion.div
                              layoutId="activeIndicator"
                              className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-r"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </motion.div>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
            Projects
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {!projects || projects.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-2 py-4 text-center"
                >
                  <p className="text-sm text-muted-foreground mb-3">
                    You don't have any projects yet
                  </p>
                  <Link href="/create">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Project
                    </Button>
                  </Link>
                </motion.div>
              ) : (
                <>
                  {projects.map((project, index) => {
                    const isSelected = project.id === projectId;
                    return (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (items.length + index) * 0.05 }}
                      >
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            asChild
                            className={cn(
                              "group transition-all duration-200",
                              isSelected &&
                                "bg-primary/10 border-l-2 border-primary"
                            )}
                          >
                            <div
                              onClick={() => setProjectId(project.id)}
                              className="flex items-center gap-3 cursor-pointer"
                            >
                              <div
                                className={cn(
                                  "flex size-8 items-center justify-center rounded-lg font-semibold text-sm transition-all duration-200 border-2",
                                  isSelected
                                    ? "bg-primary text-primary-foreground border-primary shadow-glow-cyan-sm"
                                    : "bg-secondary text-muted-foreground border-border group-hover:border-primary/50 group-hover:text-foreground"
                                )}
                              >
                                {project.name?.[0]?.toUpperCase() || ''}
                              </div>
                              <span className="font-medium truncate">{project.name}</span>
                            </div>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </motion.div>
                    );
                  })}

                  {open && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="pt-2 px-2"
                    >
                      <Link href="/create">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Project
                        </Button>
                      </Link>
                    </motion.div>
                  )}
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
