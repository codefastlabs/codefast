import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@codefast/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

const DATA = [
  { month: "Jan", users: 320 },
  { month: "Feb", users: 480 },
  { month: "Mar", users: 510 },
  { month: "Apr", users: 690 },
  { month: "May", users: 820 },
  { month: "Jun", users: 1040 },
];

const CONFIG = {
  users: { label: "Active users", color: "var(--color-primary)" },
};

export function ChartArea() {
  return (
    <ChartContainer config={CONFIG} className="min-h-[220px] w-full max-w-md">
      <AreaChart accessibilityLayer data={DATA} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          dataKey="users"
          type="natural"
          stroke="var(--color-users)"
          fill="var(--color-users)"
          fillOpacity={0.25}
        />
      </AreaChart>
    </ChartContainer>
  );
}
