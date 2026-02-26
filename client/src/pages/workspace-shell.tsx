import { useRoute, Switch, Route, Redirect } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { WorkspaceProvider } from "@/lib/workspace";
import { setStoredWorkspaceId } from "@/lib/workspace";
import Experiences from "@/pages/experiences";
import ExperienceDetail from "@/pages/experience-detail";
import AnswerBank from "@/pages/answer-bank";
import { Loader2 } from "lucide-react";

export default function WorkspaceShell() {
  const [, params] = useRoute("/w/:workspaceId/:rest*");
  const workspaceId = params?.workspaceId || "";

  const { data: workspace, isLoading, isError } = useQuery({
    queryKey: ["/api/workspaces", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}`);
      if (!res.ok) return null;
      return await res.json();
    },
    enabled: !!workspaceId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!workspace || isError) {
    return <Redirect to="/" />;
  }

  setStoredWorkspaceId(workspaceId);

  return (
    <WorkspaceProvider workspaceId={workspaceId}>
      <Switch>
        <Route path="/w/:workspaceId" component={() => <Redirect to={`/w/${workspaceId}/experiences`} />} />
        <Route path="/w/:workspaceId/experiences" component={Experiences} />
        <Route path="/w/:workspaceId/experiences/:id" component={ExperienceDetail} />
        <Route path="/w/:workspaceId/answer-bank" component={AnswerBank} />
        <Route component={() => <Redirect to={`/w/${workspaceId}/experiences`} />} />
      </Switch>
    </WorkspaceProvider>
  );
}
