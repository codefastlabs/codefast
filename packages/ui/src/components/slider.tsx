'use client';

import type { ComponentProps, JSX } from 'react';

import { useMemo } from 'react';

import { cn } from '@codefast/tailwind-variants';
import * as SliderPrimitive from '@radix-ui/react-slider';

/* -----------------------------------------------------------------------------
 * Component: Slider
 * -------------------------------------------------------------------------- */

type SliderProps = ComponentProps<typeof SliderPrimitive.Root>;

function Slider({ className, defaultValue, max = 100, min = 0, value, ...props }: SliderProps): JSX.Element {
  const _values = useMemo(() => {
    if (Array.isArray(value)) {
      return value;
    }

    return Array.isArray(defaultValue) ? defaultValue : [min, max];
  }, [value, defaultValue, min, max]);

  return (
    <SliderPrimitive.Root
      className={cn(
        'relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col',
        className,
      )}
      data-slot="slider"
      defaultValue={defaultValue}
      max={max}
      min={min}
      value={value}
      {...props}
    >
      <SliderPrimitive.Track
        className="bg-input relative w-full grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1"
        data-slot="slider-track"
      >
        <SliderPrimitive.Range
          className="bg-primary absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
          data-slot="slider-range"
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          aria-label="Volume"
          className={cn(
            'border-primary bg-primary after:bg-background focus-visible:ring-primary/20 dark:focus-visible:ring-primary/40 flex size-4 items-center justify-center rounded-full border-2 shadow-sm outline-hidden after:size-full after:rounded-full after:transition-[width,height] focus-visible:ring-4 active:not-data-disabled:after:size-1',
          )}
          data-slot="slider-thumb"
        />
      ))}
    </SliderPrimitive.Root>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Slider };
export type { SliderProps };
