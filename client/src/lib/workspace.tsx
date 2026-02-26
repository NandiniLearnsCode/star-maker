import { createContext, useContext, type ReactNode } from "react";

const WorkspaceContext = createContext<string | null>(null);

export function WorkspaceProvider({ workspaceId, children }: { workspaceId: string; children: ReactNode }) {
  return (
    <WorkspaceContext.Provider value={workspaceId}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceId(): string {
  const id = useContext(WorkspaceContext);
  if (!id) throw new Error("useWorkspaceId must be used inside WorkspaceProvider");
  return id;
}

export function getStoredWorkspaceId(): string | null {
  return localStorage.getItem("workspaceId");
}

export function setStoredWorkspaceId(id: string) {
  localStorage.setItem("workspaceId", id);
}
