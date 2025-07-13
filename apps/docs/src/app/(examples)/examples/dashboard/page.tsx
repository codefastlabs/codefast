import type { JSX } from "react";

import { ChartAreaInteractive } from "@/app/(examples)/examples/dashboard/_components/chart-area-interactive";
import { DataTable } from "@/app/(examples)/examples/dashboard/_components/data-table";
import { SectionCards } from "@/app/(examples)/examples/dashboard/_components/section-cards";
import data from "@/app/(examples)/examples/dashboard/data.json";

export default function Page(): JSX.Element {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive />
        </div>
        <DataTable data={data} />
      </div>
    </div>
  );
}
