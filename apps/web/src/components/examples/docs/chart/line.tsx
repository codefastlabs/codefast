import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@codefast/ui/chart";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

const DATA = [
  { month: "Jan", revenue: 1200 },
  { month: "Feb", revenue: 1900 },
  { month: "Mar", revenue: 1700 },
  { month: "Apr", revenue: 2400 },
  { month: "May", revenue: 2100 },
  { month: "Jun", revenue: 2800 },
];

const CONFIG = {
  revenue: { label: "Revenue", color: "var(--color-primary)" },
};

export function ChartLine() {
  return (
    <ChartContainer config={CONFIG} className="min-h-[220px] w-full max-w-md">
      <LineChart accessibilityLayer data={DATA} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          dataKey="revenue"
          type="monotone"
          stroke="var(--color-revenue)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
