import { Briefcase, Sparkles, BookOpen, Link2, Mic } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useWorkspaceId } from "@/lib/workspace";
import { useToast } from "@/hooks/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const [location] = useLocation();
  const wsId = useWorkspaceId();
  const { toast } = useToast();

  const items = [
    { title: "Experiences", url: `/w/${wsId}/experiences`, icon: Briefcase },
    { title: "Answer Bank", url: `/w/${wsId}/answer-bank`, icon: BookOpen },
    { title: "Voice Practice", url: `/w/${wsId}/practice`, icon: Mic },
  ];

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/w/${wsId}/experiences`;
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link copied!", description: "Share this private link to give someone access to your workspace." });
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground p-1.5 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg text-sidebar-foreground tracking-wide group-data-[collapsible=icon]:hidden">
            STAR Maker
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = location.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      tooltip={item.title}
                      className={isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50"}
                    >
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
          onClick={handleCopyLink}
          data-testid="button-copy-link"
        >
          <Link2 className="w-4 h-4 mr-2 group-data-[collapsible=icon]:mr-0" />
          <span className="group-data-[collapsible=icon]:hidden">Copy Share Link</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
