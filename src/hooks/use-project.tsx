import { api } from "@/trpc/react";
import { useLocalStorage } from "usehooks-ts";
import { useEffect, useCallback, useMemo } from "react";

const useProject = () => {
  const { data: projects } = api.project.getProjects.useQuery(undefined, {
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  });
  const [projectId, setProjectId] = useLocalStorage<string | null>("dionysus-projectId", null);

  // Clear projectId if it doesn't exist in projects list
  useEffect(() => {
    if (projectId && projects && !projects.find((p) => p.id === projectId)) {
      setProjectId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, projects]);

  const project = useMemo(
    () => (projectId ? projects?.find((project) => project.id === projectId) : null),
    [projectId, projects],
  );

  const handleSetProjectId = useCallback(
    (id: string | null) => {
      setProjectId(id);
    },
    [setProjectId],
  );

  return {
    projects,
    project,
    projectId: projectId ?? "",
    setProjectId: handleSetProjectId,
  };
};

export default useProject;
