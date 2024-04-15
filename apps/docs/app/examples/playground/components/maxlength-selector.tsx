"use client";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@codefast/ui/hover-card";
import { Slider, type SliderProps } from "@codefast/ui/slider";
import { Label } from "@codefast/ui/label";
import { type JSX, useState } from "react";

interface MaxLengthSelectorProps {
  defaultValue: SliderProps["defaultValue"];
}

export function MaxLengthSelector({ defaultValue }: MaxLengthSelectorProps): JSX.Element {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="grid gap-2 pt-2">
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="maxlength">Maximum Length</Label>
              <span className="text-muted-foreground hover:border-border w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm">
                {value}
              </span>
            </div>
            <Slider
              id="maxlength"
              max={4000}
              defaultValue={value}
              step={10}
              onValueChange={setValue}
              className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
              aria-label="Maximum Length"
            />
          </div>
        </HoverCardTrigger>
        <HoverCardContent align="start" className="w-64 text-sm" side="left">
          The maximum number of tokens to generate. Requests can use up to 2,048 or 4,000 tokens, shared between prompt
          and completion. The exact limit varies by model.
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}
