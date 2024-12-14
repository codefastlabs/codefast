'use client';

import { type SliderProps, HoverCard, HoverCardContent, HoverCardTrigger, Label, Slider } from '@codefast/ui';
import { type JSX, useState } from 'react';

interface TopPSelectorProps {
  defaultValue: SliderProps['defaultValue'];
}

export function TopPSelector({ defaultValue }: TopPSelectorProps): JSX.Element {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="grid gap-2 pt-2">
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="top-p">Top P</Label>
              <span className="text-muted-foreground hover:border-border w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm">
                {value}
              </span>
            </div>
            <Slider aria-label="Top P" defaultValue={value} id="top-p" max={1} step={0.1} onValueChange={setValue} />
          </div>
        </HoverCardTrigger>
        <HoverCardContent align="start" className="w-64 text-sm" side="left">
          Control diversity via nucleus sampling: 0.5 means half of all likelihood-weighted options are considered.
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}
