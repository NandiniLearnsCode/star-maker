import { Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import WorkspaceShell from "@/pages/workspace-shell";

function Router() {
  const [location] = useLocation();
  const normalizedLocation = location.length > 1 ? location.replace(/\/+$/, "") : location;

  if (normalizedLocation !== location) {
    return <Redirect to={normalizedLocation} />;
  }

  if (location === "/") return <Home />;
  if (location.startsWith("/w/")) return <WorkspaceShell />;
  return <NotFound />;
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
