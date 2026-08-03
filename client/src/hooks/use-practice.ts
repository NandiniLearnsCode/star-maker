import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type PracticeSessionInput, type PracticeTurnInput } from "@shared/routes";
import { type PracticeSession } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useWorkspaceId } from "@/lib/workspace";

function wsHeaders(workspaceId: string) {
  return { "X-Workspace-Id": workspaceId };
}

export function usePracticeSessions() {
  const wsId = useWorkspaceId();
  return useQuery<PracticeSession[]>({
    queryKey: [api.practiceSessions.list.path, wsId],
    queryFn: async () => {
      const res = await fetch(api.practiceSessions.list.path, {
        credentials: "include",
        headers: wsHeaders(wsId),
      });
      if (!res.ok) throw new Error("Failed to fetch practice sessions");
      return await res.json();
    },
  });
}

export function useCreatePracticeSession() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const wsId = useWorkspaceId();

  return useMutation({
    mutationFn: async (input: PracticeSessionInput) => {
      const res = await fetch(api.practiceSessions.create.path, {
        method: api.practiceSessions.create.method,
        headers: { "Content-Type": "application/json", ...wsHeaders(wsId) },
        body: JSON.stringify(input),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to create practice session" }));
        throw new Error(error.message);
      }
      return await res.json() as PracticeSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.practiceSessions.list.path] });
    },
    onError: (err: Error) => {
      toast({ title: "Could not create practice session", description: err.message, variant: "destructive" });
    },
  });
}

export function usePracticeConversationToken() {
  const wsId = useWorkspaceId();

  return useMutation({
    mutationFn: async (sessionId: number) => {
      const url = buildUrl(api.practiceSessions.conversationToken.path, { id: sessionId });
      const res = await fetch(url, {
        method: api.practiceSessions.conversationToken.method,
        credentials: "include",
        headers: wsHeaders(wsId),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to start voice practice" }));
        throw new Error(error.message);
      }
      return await res.json() as {
        token: string;
        practiceSessionId: number;
        dynamicVariables: Record<string, string>;
      };
    },
  });
}

export function useAddPracticeTurn() {
  const queryClient = useQueryClient();
  const wsId = useWorkspaceId();

  return useMutation({
    mutationFn: async ({ sessionId, ...input }: PracticeTurnInput & { sessionId: number }) => {
      const url = buildUrl(api.practiceSessions.addTurn.path, { id: sessionId });
      const res = await fetch(url, {
        method: api.practiceSessions.addTurn.method,
        headers: { "Content-Type": "application/json", ...wsHeaders(wsId) },
        body: JSON.stringify(input),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save transcript turn");
      return await res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.practiceSessions.get.path, variables.sessionId] });
    },
  });
}

export function useCompletePracticeSession() {
  const queryClient = useQueryClient();
  const wsId = useWorkspaceId();

  return useMutation({
    mutationFn: async ({ sessionId, elevenLabsConversationId }: { sessionId: number; elevenLabsConversationId?: string }) => {
      const url = buildUrl(api.practiceSessions.complete.path, { id: sessionId });
      const res = await fetch(url, {
        method: api.practiceSessions.complete.method,
        headers: { "Content-Type": "application/json", ...wsHeaders(wsId) },
        body: JSON.stringify({ elevenLabsConversationId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to complete practice session");
      return await res.json() as PracticeSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.practiceSessions.list.path] });
    },
  });
}

export function useGeneratePracticeFeedback() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const wsId = useWorkspaceId();

  return useMutation({
    mutationFn: async (sessionId: number) => {
      const url = buildUrl(api.practiceSessions.feedback.path, { id: sessionId });
      const res = await fetch(url, {
        method: api.practiceSessions.feedback.method,
        credentials: "include",
        headers: wsHeaders(wsId),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to generate feedback" }));
        throw new Error(error.message);
      }
      return await res.json() as PracticeSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.practiceSessions.list.path] });
      toast({ title: "Practice feedback ready", description: "Review your STAR structure and next steps." });
    },
    onError: (err: Error) => {
      toast({ title: "Feedback failed", description: err.message, variant: "destructive" });
    },
  });
}
