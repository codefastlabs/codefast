"use client";

import {
  Button,
  cn,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@codefast/ui";
import { ChevronUpIcon, CircleIcon, MinusIcon, PlusIcon } from "lucide-react";
import type { CSSProperties, JSX } from "react";
import { useCallback, useState } from "react";
import { Bar, BarChart, ResponsiveContainer } from "recharts";

import { GridWrapper } from "@/components/grid-wrapper";

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

export function DrawerDemo(): JSX.Element {
  return (
    <GridWrapper className="*:grid *:place-items-center">
      <div className="">
        <DrawerBottom />
      </div>
      <div className="">
        <DrawerScrollableContent />
      </div>
      <div className="">
        <DrawerDirections />
      </div>
    </GridWrapper>
  );
}

function DrawerBottom(): JSX.Element {
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
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Move Goal</DrawerTitle>
            <DrawerDescription>Set your daily activity goal.</DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="text-sm">
            <div className="flex items-center justify-center space-x-2">
              <Button
                className="size-8 shrink-0 rounded-full"
                disabled={goal <= 200}
                onClick={() => {
                  onClick(-10);
                }}
                size="icon"
                variant="outline"
              >
                <MinusIcon />
                <span className="sr-only">Decrease</span>
              </Button>
              <div className="flex-1 text-center">
                <div className="text-7xl font-bold tracking-tighter">{goal}</div>
                <div className="text-muted-foreground text-[0.70rem] uppercase">Calories/day</div>
              </div>
              <Button
                className="size-8 shrink-0 rounded-full"
                disabled={goal >= 400}
                onClick={() => {
                  onClick(10);
                }}
                size="icon"
                variant="outline"
              >
                <PlusIcon />
                <span className="sr-only">Increase</span>
              </Button>
            </div>
            <div className="mt-3 h-[120px]">
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={data}>
                  <Bar
                    dataKey="goal"
                    style={
                      {
                        fill: "var(--foreground)",
                        opacity: 0.9,
                      } as CSSProperties
                    }
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DrawerBody>
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

function DrawerScrollableContent(): JSX.Element {
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
        <DrawerBody className="border-y text-sm">
          <h4 className="mb-4 text-lg font-medium leading-none">Lorem Ipsum</h4>
          {Array.from({ length: 10 }).map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: keep
            <p className="mb-4 leading-normal" key={index}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
              ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
              fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
              mollit anim id est laborum.
            </p>
          ))}
        </DrawerBody>
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

const DIRECTIONS = ["top", "right", "bottom", "left"] as const;

function DrawerDirections(): JSX.Element {
  return (
    <div className="grid grid-cols-3 gap-1">
      {DIRECTIONS.map((direction) => (
        <div
          className={cn(
            "flex items-center justify-center",
            direction === "top" && "col-start-2",
            direction === "right" && "col-start-3 row-start-2",
            direction === "bottom" && "col-start-2 row-start-3",
            direction === "left" && "row-start-2",
          )}
          key={direction}
        >
          <Drawer direction={direction}>
            <DrawerTrigger asChild>
              <Button className="capitalize" size="icon" variant="outline">
                {direction === "top" && <ChevronUpIcon className="rotate-180" />}
                {direction === "right" && <ChevronUpIcon className="rotate-270" />}
                {direction === "bottom" && <ChevronUpIcon />}
                {direction === "left" && <ChevronUpIcon className="rotate-90" />}
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Move Goal</DrawerTitle>
                <DrawerDescription>Set your daily activity goal.</DrawerDescription>
              </DrawerHeader>
              <DrawerBody className="border-y text-sm">
                {Array.from({ length: 10 }).map((_, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: keep
                  <p className="mb-4 leading-normal" key={index}>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore
                    et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                    aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
                    cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
                    culpa qui officia deserunt mollit anim id est laborum.
                  </p>
                ))}
              </DrawerBody>
              <DrawerFooter>
                <Button>Submit</Button>
                <DrawerClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      ))}

      <div className="col-start-2 row-start-2 flex items-center justify-center">
        <CircleIcon className="text-muted-foreground/50 size-4" />
      </div>
    </div>
  );
}
