'use client';

import type { SliderProps } from '@codefast/ui';
import type { JSX } from 'react';

import { HoverCard, HoverCardContent, HoverCardTrigger, Label, Slider } from '@codefast/ui';
import { useState } from 'react';

interface MaxLengthSelectorProps {
  defaultValue: SliderProps['defaultValue'];
}

export function MaxLengthSelector({ defaultValue }: MaxLengthSelectorProps): JSX.Element {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="space-y-2 pt-2">
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="maxlength">Maximum Length</Label>
              <span className="text-muted-foreground hover:border-border w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm">
                {value?.toLocaleString() ?? '0'}
              </span>
            </div>
            <Slider
              aria-label="Maximum Length"
              defaultValue={value}
              id="maxlength"
              max={4000}
              step={10}
              onValueChange={setValue}
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
