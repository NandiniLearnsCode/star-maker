import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertStarAnswer } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { useWorkspaceId } from "@/lib/workspace";

function wsHeaders(workspaceId: string) {
  return { "X-Workspace-Id": workspaceId };
}

export function useStarAnswers(experienceId?: number) {
  const wsId = useWorkspaceId();
  return useQuery({
    queryKey: [api.starAnswers.list.path, experienceId, wsId],
    queryFn: async () => {
      let url = api.starAnswers.list.path;
      if (experienceId) {
        url += `?experienceId=${experienceId}`;
      }
      const res = await fetch(url, { credentials: "include", headers: wsHeaders(wsId) });
      if (!res.ok) throw new Error("Failed to fetch STAR answers");
      return await res.json();
    },
  });
}

export function useGenerateStarAnswers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const wsId = useWorkspaceId();

  return useMutation({
    mutationFn: async (experienceId: number) => {
      const res = await fetch(api.starAnswers.generate.path, {
        method: api.starAnswers.generate.method,
        headers: { "Content-Type": "application/json", ...wsHeaders(wsId) },
        body: JSON.stringify({ experienceId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to generate STAR answers");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.starAnswers.list.path] });
      toast({ title: "STAR Answers Generated!", description: "AI has crafted your stories." });
    },
    onError: (err: Error) => {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    }
  });
}

export function useUpdateStarAnswer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const wsId = useWorkspaceId();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertStarAnswer>) => {
      const url = buildUrl(api.starAnswers.update.path, { id });
      const res = await fetch(url, {
        method: api.starAnswers.update.method,
        headers: { "Content-Type": "application/json", ...wsHeaders(wsId) },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update answer");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.starAnswers.list.path] });
      toast({ title: "STAR Answer saved" });
    },
  });
}

export function useDeleteStarAnswer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const wsId = useWorkspaceId();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.starAnswers.delete.path, { id });
      const res = await fetch(url, { method: api.starAnswers.delete.method, credentials: "include", headers: wsHeaders(wsId) });
      if (!res.ok) throw new Error("Failed to delete answer");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.starAnswers.list.path] });
      toast({ title: "Answer deleted" });
    },
  });
}

export function useCustomizeStarAnswer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const wsId = useWorkspaceId();

  return useMutation({
    mutationFn: async ({ starAnswerId, companyId }: { starAnswerId: number, companyId: number }) => {
      const url = buildUrl(api.starAnswers.customize.path, { id: starAnswerId });
      const res = await fetch(url, {
        method: api.starAnswers.customize.method,
        headers: { "Content-Type": "application/json", ...wsHeaders(wsId) },
        body: JSON.stringify({ companyId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to customize answer");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.starAnswers.list.path] });
      toast({ title: "Answer customized for company!" });
    },
    onError: (err: Error) => {
      toast({ title: "Customization failed", description: err.message, variant: "destructive" });
    }
  });
}
