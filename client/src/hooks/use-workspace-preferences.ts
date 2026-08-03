import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type Workspace } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useWorkspaceId } from "@/lib/workspace";

type WorkspacePreferencesInput = {
  targetRole?: string;
  targetCompanyName?: string;
};

function wsHeaders(workspaceId: string) {
  return { "X-Workspace-Id": workspaceId };
}

export function useWorkspacePreferences() {
  const wsId = useWorkspaceId();
  return useQuery<Workspace>({
    queryKey: ["/api/workspaces", wsId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${wsId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch workspace preferences");
      return await res.json();
    },
  });
}

export function useUpdateWorkspacePreferences() {
  const wsId = useWorkspaceId();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: WorkspacePreferencesInput) => {
      const res = await fetch(api.workspaces.updatePreferences.path, {
        method: api.workspaces.updatePreferences.method,
        headers: { "Content-Type": "application/json", ...wsHeaders(wsId) },
        body: JSON.stringify(input),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to save interview target" }));
        throw new Error(error.message);
      }
      return await res.json() as Workspace;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces", wsId] });
    },
    onError: (err: Error) => {
      toast({ title: "Interview target not saved", description: err.message, variant: "destructive" });
    },
  });
}
