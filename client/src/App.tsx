import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WorkspaceProvider } from "@/lib/workspace";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import WorkspaceShell from "@/pages/workspace-shell";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/w/:workspaceId/:rest*" component={WorkspaceShell} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
