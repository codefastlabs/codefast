"use client";

import { useId, useState } from "react";
import type { JSX } from "react";

import { GridWrapper } from "@/components/grid-wrapper";
import { Label, Slider } from "@codefast/ui";

export function SliderDemo(): JSX.Element {
  return (
    <GridWrapper className="*:grid *:place-items-center">
      <div>
        <Slider defaultValue={[50]} max={100} step={1} />
      </div>
      <div>
        <Slider defaultValue={[25, 50]} max={100} step={1} />
      </div>
      <div>
        <Slider defaultValue={[10, 20]} max={100} step={10} />
      </div>
      <div className="grid-cols-2 gap-6">
        <Slider defaultValue={[50]} max={100} orientation="vertical" step={1} />
        <Slider defaultValue={[25, 65]} max={100} orientation="vertical" step={1} />
      </div>
      <div>
        <SliderControlled />
      </div>
    </GridWrapper>
  );
}

function SliderControlled(): JSX.Element {
  const [value, setValue] = useState([0.3, 0.7]);
  const id = useId();

  return (
    <div className="grid w-full gap-3">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={`${id}-slider-demo-temperature`}>Temperature</Label>
        <span className="text-muted-foreground text-sm">{value.join(", ")}</span>
      </div>
      <Slider id={`${id}-slider-demo-temperature`} max={1} min={0} step={0.1} value={value} onValueChange={setValue} />
    </div>
  );
}
