import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";

export function Layout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <AppSidebar />
        <div className="flex flex-col flex-1 w-full relative">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/40 bg-card/50 backdrop-blur-sm px-4 shadow-sm z-10">
            <SidebarTrigger className="hover-elevate active-elevate-2" />
            <div className="w-px h-4 bg-border mx-2" />
            <div className="text-sm font-medium text-muted-foreground">
              Interview Coach
            </div>
          </header>
          <main className="flex-1 overflow-y-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
