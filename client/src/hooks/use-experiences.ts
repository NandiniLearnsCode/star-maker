import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertExperience } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { useWorkspaceId } from "@/lib/workspace";

function wsHeaders(workspaceId: string) {
  return { "X-Workspace-Id": workspaceId };
}

export function useExperiences() {
  const wsId = useWorkspaceId();
  return useQuery({
    queryKey: [api.experiences.list.path, wsId],
    queryFn: async () => {
      const res = await fetch(api.experiences.list.path, { credentials: "include", headers: wsHeaders(wsId) });
      if (!res.ok) throw new Error("Failed to fetch experiences");
      return await res.json();
    },
  });
}

export function useExperience(id: number) {
  const wsId = useWorkspaceId();
  return useQuery({
    queryKey: [api.experiences.get.path, id, wsId],
    queryFn: async () => {
      const url = buildUrl(api.experiences.get.path, { id });
      const res = await fetch(url, { credentials: "include", headers: wsHeaders(wsId) });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch experience");
      return await res.json();
    },
    enabled: !!id,
  });
}

export function useCreateExperience() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const wsId = useWorkspaceId();

  return useMutation({
    mutationFn: async (data: Omit<InsertExperience, 'workspaceId'>) => {
      const res = await fetch(api.experiences.create.path, {
        method: api.experiences.create.method,
        headers: { "Content-Type": "application/json", ...wsHeaders(wsId) },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create experience");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.experiences.list.path] });
      toast({ title: "Experience added successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error creating experience", description: err.message, variant: "destructive" });
    }
  });
}

export function useUpdateExperience() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const wsId = useWorkspaceId();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertExperience>) => {
      const url = buildUrl(api.experiences.update.path, { id });
      const res = await fetch(url, {
        method: api.experiences.update.method,
        headers: { "Content-Type": "application/json", ...wsHeaders(wsId) },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update experience");
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [api.experiences.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.experiences.get.path, data.id] });
      toast({ title: "Experience updated" });
    },
  });
}

export function useDeleteExperience() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const wsId = useWorkspaceId();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.experiences.delete.path, { id });
      const res = await fetch(url, { method: api.experiences.delete.method, credentials: "include", headers: wsHeaders(wsId) });
      if (!res.ok) throw new Error("Failed to delete experience");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.experiences.list.path] });
      toast({ title: "Experience deleted" });
    },
  });
}

export function useParseResume() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const wsId = useWorkspaceId();

  return useMutation({
    mutationFn: async (resumeText: string) => {
      const res = await fetch(api.experiences.parseResume.path, {
        method: api.experiences.parseResume.method,
        headers: { "Content-Type": "application/json", ...wsHeaders(wsId) },
        body: JSON.stringify({ resumeText }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to parse resume");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.experiences.list.path] });
      toast({ title: "Resume parsed successfully!", description: "Experiences have been extracted." });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to parse resume", description: err.message, variant: "destructive" });
    }
  });
}

export function useUploadResume() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const wsId = useWorkspaceId();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await fetch('/api/experiences/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: wsHeaders(wsId),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message || "Upload failed");
      }
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [api.experiences.list.path] });
      const count = Array.isArray(data) ? data.length : 0;
      toast({ title: "Resume uploaded!", description: `Extracted ${count} experience${count !== 1 ? 's' : ''} from your resume.` });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to upload resume", description: err.message, variant: "destructive" });
    }
  });
}
