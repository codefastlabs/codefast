"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import type { ComponentProps, JSX } from "react";
import { useMemo } from "react";

import { cn } from "@/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: Slider
 * -------------------------------------------------------------------------- */

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: ComponentProps<typeof SliderPrimitive.Root>): JSX.Element {
  const _values = useMemo(() => {
    if (Array.isArray(value)) {
      return value;
    }

    return Array.isArray(defaultValue) ? defaultValue : [min, max];
  }, [value, defaultValue, min, max]);

  return (
    <SliderPrimitive.Root
      className={cn(
        "data-disabled:opacity-50 relative flex w-full touch-none select-none items-center data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
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
        className="bg-input relative w-full grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1 data-[orientation=vertical]:h-full data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-1"
        data-slot="slider-track"
      >
        <SliderPrimitive.Range
          className="bg-primary absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
          data-slot="slider-range"
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          // biome-ignore lint/suspicious/noArrayIndexKey: keep
          key={index}
          aria-label="Volume"
          className={cn(
            "border-primary bg-primary after:bg-background active:not-data-disabled:after:size-1 focus-visible:ring-primary/20 dark:focus-visible:ring-primary/40 outline-hidden flex size-4 items-center justify-center rounded-full border-2 shadow-sm after:size-full after:rounded-full after:transition-[width,height] focus-visible:ring-4",
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
