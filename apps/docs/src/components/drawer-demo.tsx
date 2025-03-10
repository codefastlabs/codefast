'use client';

import type { CSSProperties, JSX } from 'react';

import {
  Button,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@codefast/ui';
import { Minus, Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer } from 'recharts';

const data = [
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

export function DrawerDemo(): JSX.Element {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <DrawerBottom />

      <DrawerScrollableContent />

      <DrawerDirections />
    </div>
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
                icon
                className="h-8 w-8 shrink-0 rounded-full"
                disabled={goal <= 200}
                variant="outline"
                onClick={() => {
                  onClick(-10);
                }}
              >
                <Minus />

                <span className="sr-only">Decrease</span>
              </Button>

              <div className="flex-1 text-center">
                <div className="text-7xl font-bold tracking-tighter">{goal}</div>

                <div className="text-muted-foreground text-[0.70rem] uppercase">Calories/day</div>
              </div>

              <Button
                icon
                className="h-8 w-8 shrink-0 rounded-full"
                disabled={goal >= 400}
                variant="outline"
                onClick={() => {
                  onClick(10);
                }}
              >
                <Plus />

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
                        fill: 'hsl(var(--foreground))',
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
            // eslint-disable-next-line react/no-array-index-key -- keep
            <p key={index} className="mb-4 leading-normal">
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

const directions = ['top', 'right', 'bottom', 'left'] as const;

function DrawerDirections(): JSX.Element {
  return (
    <>
      {directions.map((direction) => (
        <Drawer key={direction} direction={direction}>
          <DrawerTrigger asChild>
            <Button className="capitalize" variant="outline">
              {direction}
            </Button>
          </DrawerTrigger>

          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Move Goal</DrawerTitle>

              <DrawerDescription>Set your daily activity goal.</DrawerDescription>
            </DrawerHeader>

            <DrawerBody className="border-y text-sm">
              {Array.from({ length: 10 }).map((_, index) => (
                // eslint-disable-next-line react/no-array-index-key -- keep
                <p key={index} className="mb-4 leading-normal">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
                  dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                  aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
                  dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
                  officia deserunt mollit anim id est laborum.
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
      ))}
    </>
  );
}
