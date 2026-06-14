import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@codefast/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

const data = [
  { month: "Jan", visitors: 186 },
  { month: "Feb", visitors: 305 },
  { month: "Mar", visitors: 237 },
  { month: "Apr", visitors: 73 },
  { month: "May", visitors: 209 },
  { month: "Jun", visitors: 214 },
];

const chartConfig = {
  visitors: { label: "Visitors", color: "var(--color-primary)" },
};

export function ChartDemo() {
  return (
    <ChartContainer className="min-h-50 w-full" config={chartConfig}>
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis axisLine={false} dataKey="month" tickLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="visitors" fill="var(--color-visitors)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
