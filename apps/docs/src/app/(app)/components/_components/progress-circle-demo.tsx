"use client";

import type { JSX } from "react";

import { useEffect, useState } from "react";

import { GridWrapper } from "@/components/grid-wrapper";
import { ProgressCircle } from "@codefast/ui";

export function ProgressCircleDemo(): JSX.Element {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((previous) => {
        if (previous >= 80) {
          clearInterval(interval);
        }

        return previous < 100 ? previous + 20 : 0;
      });
    }, 1000);

    return (): void => {
      clearInterval(interval);
    };
  }, []);

  return (
    <GridWrapper className="*:grid *:place-items-center *:gap-6">
      <div className="col-span-full grid-flow-col">
        <div>
          <ProgressCircle size="sm" value={progress} />
        </div>
        <div>
          <ProgressCircle value={progress} />
        </div>
        <div>
          <ProgressCircle size="lg" value={progress} />
        </div>
        <div>
          <ProgressCircle size="xl" value={progress} />
        </div>
        <div>
          <ProgressCircle size="2xl" value={progress} />
        </div>
      </div>
      <div className="col-span-full grid-flow-col">
        <div>
          <ProgressCircle showValue size="sm" value={progress} />
        </div>
        <div>
          <ProgressCircle showValue value={progress} />
        </div>
        <div>
          <ProgressCircle showValue size="lg" value={progress} />
        </div>
        <div>
          <ProgressCircle showValue size="xl" value={progress} />
        </div>
        <div>
          <ProgressCircle showValue size="2xl" value={progress} />
        </div>
      </div>
      <div className="col-span-full grid-flow-col">
        <div>
          <ProgressCircle size="sm" value={progress} variant="destructive" />
        </div>
        <div>
          <ProgressCircle value={progress} variant="destructive" />
        </div>
        <div>
          <ProgressCircle size="lg" value={progress} variant="destructive" />
        </div>
        <div>
          <ProgressCircle size="xl" value={progress} variant="destructive" />
        </div>
        <div>
          <ProgressCircle size="2xl" value={progress} variant="destructive" />
        </div>
      </div>
      <div className="col-span-full grid-flow-col">
        <div>
          <ProgressCircle showValue size="sm" value={progress} variant="destructive" />
        </div>
        <div>
          <ProgressCircle showValue value={progress} variant="destructive" />
        </div>
        <div>
          <ProgressCircle showValue size="lg" value={progress} variant="destructive" />
        </div>
        <div>
          <ProgressCircle showValue size="xl" value={progress} variant="destructive" />
        </div>
        <div>
          <ProgressCircle showValue size="2xl" value={progress} variant="destructive" />
        </div>
      </div>
      <div className="grid-flow-col">
        <ProgressCircle size="lg" thickness="thick" value={progress} />
        <ProgressCircle size="lg" thickness="thin" value={progress} />
      </div>
      <div className="grid-flow-col">
        <ProgressCircle size="lg" thickness="thick" value={progress} variant="destructive" />
        <ProgressCircle size="lg" thickness="thin" value={progress} variant="destructive" />
      </div>
      <div className="">
        <ProgressCircle
          showValue
          formatValue={(value) => `${value.toString()}/100`}
          size="xl"
          value={progress}
        />
      </div>
      <div className="">
        <ProgressCircle customLabel={CustomProgressLabel} size="xl" value={progress} />
      </div>
      <div className="">
        <ProgressCircle showValue size="xl" strokeWidth={10} value={progress} />
      </div>
      <div className="">
        <ProgressCircle
          showValue
          size="xl"
          thresholds={[
            {
              background: "color-mix(in oklab, var(--color-red-500) 20%, transparent)",
              color: "var(--color-red-500)",
              value: 30,
            },
            {
              background: "color-mix(in oklab, var(--color-yellow-500) 20%, transparent)",
              color: "var(--color-yellow-500)",
              value: 70,
            },
            {
              background: "color-mix(in oklab, var(--color-green-500) 20%, transparent)",
              color: "var(--color-green-500)",
              value: 100,
            },
          ]}
          value={progress}
        />
      </div>
      <div className="">
        <ProgressCircle
          showValue
          size="xl"
          thresholds={[
            {
              background: "color-mix(in oklab, var(--color-red-500) 20%, transparent)",
              color: "var(--color-red-500)",
              value: 30,
            },
            {
              background: "color-mix(in oklab, var(--color-yellow-500) 20%, transparent)",
              color: "var(--color-yellow-500)",
              value: 70,
            },
            {
              background: "color-mix(in oklab, var(--color-green-500) 20%, transparent)",
              color: "var(--color-green-500)",
              value: 100,
            },
          ]}
          value={20}
        />
        <ProgressCircle
          showValue
          size="xl"
          thresholds={[
            {
              background: "color-mix(in oklab, var(--color-red-500) 20%, transparent)",
              color: "var(--color-red-500)",
              value: 30,
            },
            {
              background: "color-mix(in oklab, var(--color-yellow-500) 20%, transparent)",
              color: "var(--color-yellow-500)",
              value: 70,
            },
            {
              background: "color-mix(in oklab, var(--color-green-500) 20%, transparent)",
              color: "var(--color-green-500)",
              value: 100,
            },
          ]}
          value={60}
        />
        <ProgressCircle
          showValue
          size="xl"
          thresholds={[
            {
              background: "color-mix(in oklab, var(--color-red-500) 20%, transparent)",
              color: "var(--color-red-500)",
              value: 30,
            },
            {
              background: "color-mix(in oklab, var(--color-yellow-500) 20%, transparent)",
              color: "var(--color-yellow-500)",
              value: 70,
            },
            {
              background: "color-mix(in oklab, var(--color-green-500) 20%, transparent)",
              color: "var(--color-green-500)",
              value: 100,
            },
          ]}
          value={90}
        />
      </div>
      <div className="">
        <ProgressCircle
          showValue
          classNames={{ label: "text-2xl font-bold" }}
          sizeInPixels={150}
          value={progress}
        />
      </div>
    </GridWrapper>
  );
}

function CustomProgressLabel({ value }: { value: number }): JSX.Element {
  return (
    <div className="flex flex-col text-center">
      <span className="text-lg font-bold">{value}%</span>
      <span className="text-xs">Complete</span>
    </div>
  );
}
