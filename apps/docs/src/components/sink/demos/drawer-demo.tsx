import { cn } from "@codefast/tailwind-variants";
import { Button } from "@codefast/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@codefast/ui/drawer";
import { MinusIcon, PlusIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { Bar, BarChart, ResponsiveContainer } from "recharts";
import type { CSSProperties } from "react";

interface GoalItem {
  goal: number;
}

const data: Array<GoalItem> = [
  {
    goal: 400,
  },
  {
    goal: 300,
  },
  {
    goal: 200,
  },
  {
    goal: 300,
  },
  {
    goal: 200,
  },
  {
    goal: 278,
  },
  {
    goal: 189,
  },
  {
    goal: 239,
  },
  {
    goal: 300,
  },
  {
    goal: 200,
  },
  {
    goal: 278,
  },
  {
    goal: 189,
  },
  {
    goal: 349,
  },
];

export function DrawerDemo() {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <DrawerBottom />
      <DrawerScrollableContent />
      <DrawerDirections />
    </div>
  );
}

function DrawerBottom() {
  const [goal, setGoal] = useState(350);

  const onClick = useCallback((adjustment: number) => {
    setGoal((prevGoal) => Math.max(200, Math.min(400, prevGoal + adjustment)));
  }, []);

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Open Drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className={cn("w-full max-w-sm", "mx-auto")}>
          <DrawerHeader>
            <DrawerTitle>Move Goal</DrawerTitle>
            <DrawerDescription>Set your daily activity goal.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                className={cn("h-8 w-8 shrink-0", "rounded-full")}
                onClick={() => onClick(-10)}
                disabled={goal <= 200}
              >
                <MinusIcon />
                <span className="sr-only">Decrease</span>
              </Button>
              <div className={cn("flex-1", "text-center")}>
                <div className="text-7xl font-bold tracking-tighter">{goal}</div>
                <div className="text-xs text-muted-foreground uppercase">Calories/day</div>
              </div>
              <Button
                variant="outline"
                size="icon"
                className={cn("h-8 w-8 shrink-0", "rounded-full")}
                onClick={() => onClick(10)}
                disabled={goal >= 400}
              >
                <PlusIcon />
                <span className="sr-only">Increase</span>
              </Button>
            </div>
            <div className={cn("h-30", "mt-3")}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <Bar
                    dataKey="goal"
                    style={
                      {
                        fill: "var(--primary)",
                        opacity: 0.9,
                      } as CSSProperties
                    }
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <DrawerFooter>
            <Button>Submit</Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function DrawerScrollableContent() {
  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button variant="outline">Scrollable Content</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Move Goal</DrawerTitle>
          <DrawerDescription>Set your daily activity goal.</DrawerDescription>
        </DrawerHeader>
        <div className={cn("overflow-y-auto", "px-4", "text-sm")}>
          <h4 className={cn("mb-4", "text-lg leading-none font-medium")}>Lorem Ipsum</h4>
          {Array.from({ length: 10 }).map((_, index) => (
            <p key={index} className={cn("mb-4", "leading-normal")}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
              exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
              dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
              Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
              mollit anim id est laborum.
            </p>
          ))}
        </div>
        <DrawerFooter>
          <Button>Submit</Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

const directions = ["top", "right", "bottom", "left"] as const;

function DrawerDirections() {
  return (
    <>
      {directions.map((direction) => (
        <Drawer key={direction} direction={direction}>
          <DrawerTrigger asChild>
            <Button variant="outline" className="capitalize">
              {direction}
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Move Goal</DrawerTitle>
              <DrawerDescription>Set your daily activity goal.</DrawerDescription>
            </DrawerHeader>
            <div className={cn("overflow-y-auto", "px-4", "text-sm")}>
              {Array.from({ length: 10 }).map((_, index) => (
                <p key={index} className={cn("mb-4", "leading-normal")}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                  incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                  exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute
                  irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
                  pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
                  officia deserunt mollit anim id est laborum.
                </p>
              ))}
            </div>
            <DrawerFooter>
              <Button>Submit</Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ))}
    </>
  );
}
