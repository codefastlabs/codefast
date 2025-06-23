import { SidebarInset, SidebarProvider } from "@codefast/ui";
import { cookies } from "next/headers";
import type { CSSProperties, JSX, ReactNode } from "react";

import { AppSidebar } from "@/app/(examples)/examples/dashboard/_components/app-sidebar";
import { SiteHeader } from "@/app/(examples)/examples/dashboard/_components/site-header";
import "@/app/(examples)/examples/dashboard/theme.css";

export default async function DashboardLayout({ children }: { children: ReactNode }): Promise<JSX.Element> {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
        } as CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
