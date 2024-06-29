'use client';

import { HoverCard, HoverCardContent, HoverCardTrigger } from '@codefast/ui/hover-card';
import { Label } from '@codefast/ui/label';
import { Slider, type SliderProps } from '@codefast/ui/slider';
import { useState } from 'react';
import { type JSX } from 'react';

interface TemperatureSelectorProps {
  defaultValue: SliderProps['defaultValue'];
}

export function TemperatureSelector({ defaultValue }: TemperatureSelectorProps): JSX.Element {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="grid gap-2 pt-2">
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature">Temperature</Label>
              <span className="text-muted-foreground hover:border-border w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm">
                {value}
              </span>
            </div>
            <Slider
              id="temperature"
              max={1}
              defaultValue={value}
              step={0.1}
              onValueChange={setValue}
              aria-label="Temperature"
            />
          </div>
        </HoverCardTrigger>
        <HoverCardContent align="start" className="w-64 text-sm" side="left">
          Controls randomness: lowering results in less random completions. As the temperature approaches zero, the
          model will become deterministic and repetitive.
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}
