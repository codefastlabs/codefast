"use client";

import type { ComponentProps, JSX } from "react";

import { cn } from "@codefast/tailwind-variants";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { useMemo } from "react";

/* -----------------------------------------------------------------------------
 * Component: Slider
 * -------------------------------------------------------------------------- */

type SliderProps = ComponentProps<typeof SliderPrimitive.Root>;

function Slider({
  className,
  defaultValue,
  max = 100,
  min = 0,
  value,
  ...props
}: SliderProps): JSX.Element {
  const _values = useMemo(() => {
    if (Array.isArray(value)) {
      return value;
    }

    return Array.isArray(defaultValue) ? defaultValue : [min, max];
  }, [value, defaultValue, min, max]);

  return (
    <SliderPrimitive.Root
      className={cn(
        "relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
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
        className="relative w-full grow overflow-hidden rounded-full bg-field-border data-[orientation=horizontal]:h-1 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1"
        data-slot="slider-track"
      >
        <SliderPrimitive.Range
          className="absolute bg-primary data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
          data-slot="slider-range"
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          aria-label="Volume"
          className={cn(
            "focus-visible:ring-primary-focus-ring flex size-4 items-center justify-center rounded-full border-2 border-primary bg-primary shadow-sm outline-hidden after:size-full after:rounded-full after:bg-background after:transition-[width,height] focus-visible:ring-4 active:not-data-disabled:after:size-1",
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
