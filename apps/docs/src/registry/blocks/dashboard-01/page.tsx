import { SidebarInset, SidebarProvider } from "@codefast/ui";

import { AppSidebar } from "@/registry/blocks/dashboard-01/_components/app-sidebar";
import { ChartAreaInteractive } from "@/registry/blocks/dashboard-01/_components/chart-area-interactive";
import { DataTable } from "@/registry/blocks/dashboard-01/_components/data-table";
import { SectionCards } from "@/registry/blocks/dashboard-01/_components/section-cards";
import { SiteHeader } from "@/registry/blocks/dashboard-01/_components/site-header";
import data from "@/registry/blocks/dashboard-01/data.json";

import type { CSSProperties, JSX } from "react";

export default function Page(): JSX.Element {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
