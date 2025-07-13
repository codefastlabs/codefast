import type { JSX } from "react";

import { Badge, Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@codefast/ui";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

type TrendDirection = "down" | "up";

interface MetricCardProps {
  footer: {
    description: string;
    detail: string;
  };
  title: string;
  trend: {
    direction: TrendDirection;
    percentage: string;
  };
  value: string;
}

function MetricCard({ footer, title, trend, value }: MetricCardProps): JSX.Element {
  const TrendIcon = trend.direction === "up" ? IconTrendingUp : IconTrendingDown;

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">{value}</CardTitle>
        <CardAction>
          <Badge variant="outline">
            <TrendIcon />
            {trend.percentage}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
          {footer.description} <TrendIcon className="size-4" />
        </div>
        <div className="text-muted-foreground">{footer.detail}</div>
      </CardFooter>
    </Card>
  );
}

const METRICS_DATA: MetricCardProps[] = [
  {
    footer: {
      description: "Trending up this month",
      detail: "Visitors for the last 6 months",
    },
    title: "Total Revenue",
    trend: { direction: "up", percentage: "+12.5%" },
    value: "$1,250.00",
  },
  {
    footer: {
      description: "Down 20% this period",
      detail: "Acquisition needs attention",
    },
    title: "New Customers",
    trend: { direction: "down", percentage: "-20%" },
    value: "1,234",
  },
  {
    footer: {
      description: "Strong user retention",
      detail: "Engagement exceed targets",
    },
    title: "Active Accounts",
    trend: { direction: "up", percentage: "+12.5%" },
    value: "45,678",
  },
  {
    footer: {
      description: "Steady performance increase",
      detail: "Meets growth projections",
    },
    title: "Growth Rate",
    trend: { direction: "up", percentage: "+4.5%" },
    value: "4.5%",
  },
];

export function SectionCards(): JSX.Element {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t lg:px-6">
      {METRICS_DATA.map((metric) => (
        <MetricCard
          key={metric.title}
          footer={metric.footer}
          title={metric.title}
          trend={metric.trend}
          value={metric.value}
        />
      ))}
    </div>
  );
}
