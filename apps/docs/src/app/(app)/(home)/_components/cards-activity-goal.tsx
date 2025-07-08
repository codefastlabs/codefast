"use client";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  ChartContainer,
} from "@codefast/ui";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart } from "recharts";

import type { ChartConfig } from "@codefast/ui";
import type { JSX } from "react";

const data = [
  { goal: 400 },
  { goal: 300 },
  { goal: 200 },
  { goal: 300 },
  { goal: 200 },
  { goal: 278 },
  { goal: 189 },
  { goal: 239 },
  { goal: 300 },
  { goal: 200 },
  { goal: 278 },
  { goal: 189 },
  { goal: 349 },
];

const chartConfig = {
  goal: {
    label: "Goal",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function CardsActivityGoal(): JSX.Element {
  const [goal, setGoal] = useState(350);

  function onClick(adjustment: number): void {
    setGoal(Math.max(200, Math.min(400, goal + adjustment)));
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Move Goal</CardTitle>
        <CardDescription>Set your daily activity goal.</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center justify-center space-x-2">
          <Button
            className="h-8 w-8 shrink-0 rounded-full"
            disabled={goal <= 200}
            size="icon"
            variant="outline"
            onClick={() => {
              onClick(-10);
            }}
          >
            <Minus />
            <span className="sr-only">Decrease</span>
          </Button>
          <div className="flex-1 text-center">
            <div className="text-5xl font-bold tracking-tighter">{goal}</div>
            <div className="text-muted-foreground text-[0.70rem] uppercase">Calories/day</div>
          </div>
          <Button
            className="h-8 w-8 shrink-0 rounded-full"
            disabled={goal >= 400}
            size="icon"
            variant="outline"
            onClick={() => {
              onClick(10);
            }}
          >
            <Plus />
            <span className="sr-only">Increase</span>
          </Button>
        </div>
        <div className="my-3 h-[60px]">
          <ChartContainer className="aspect-auto h-full w-full" config={chartConfig}>
            <BarChart data={data}>
              <Bar dataKey="goal" fill="var(--color-goal)" radius={4} />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Set Goal</Button>
      </CardFooter>
    </Card>
  );
}
