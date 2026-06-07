import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@codefast/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

const DATA = [
  { month: "Jan", visitors: 186 },
  { month: "Feb", visitors: 305 },
  { month: "Mar", visitors: 237 },
  { month: "Apr", visitors: 73 },
  { month: "May", visitors: 209 },
  { month: "Jun", visitors: 214 },
];

const CONFIG = {
  visitors: { label: "Visitors", color: "var(--color-primary)" },
};

export function ChartBar() {
  return (
    <ChartContainer config={CONFIG} className="min-h-55 w-full max-w-md">
      <BarChart accessibilityLayer data={DATA}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="visitors" fill="var(--color-visitors)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
