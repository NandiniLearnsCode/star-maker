import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { useWorkspaceId } from "@/lib/workspace";

function wsHeaders(workspaceId: string) {
  return { "X-Workspace-Id": workspaceId };
}

export function useCompanies() {
  const wsId = useWorkspaceId();
  return useQuery({
    queryKey: [api.companies.list.path, wsId],
    queryFn: async () => {
      const res = await fetch(api.companies.list.path, { credentials: "include", headers: wsHeaders(wsId) });
      if (!res.ok) throw new Error("Failed to fetch companies");
      return await res.json();
    },
  });
}

export function useScrapeCompany() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const wsId = useWorkspaceId();

  return useMutation({
    mutationFn: async ({ url, name }: { url: string, name?: string }) => {
      const res = await fetch(api.companies.scrape.path, {
        method: api.companies.scrape.method,
        headers: { "Content-Type": "application/json", ...wsHeaders(wsId) },
        body: JSON.stringify({ url, name }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to scrape company");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.companies.list.path] });
      toast({ title: "Company details scraped successfully!" });
    },
    onError: (err: Error) => {
      toast({ title: "Scraping failed", description: err.message, variant: "destructive" });
    }
  });
}
