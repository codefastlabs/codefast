import { Slider as SliderPrimitive } from "radix-ui";
import type { ComponentProps, JSX } from "react";
import { useMemo } from "react";

import { cn } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: Slider
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type SliderProps = ComponentProps<typeof SliderPrimitive.Root>;

/**
 * @since 0.3.16-canary.0
 */
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
        "relative flex w-full touch-none items-center select-none data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col data-disabled:opacity-50",
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
        className="relative grow overflow-hidden rounded-full bg-muted data-horizontal:h-1.5 data-horizontal:w-full data-vertical:h-full data-vertical:w-1.5"
        data-slot="slider-track"
      >
        <SliderPrimitive.Range
          className="absolute bg-primary select-none data-horizontal:h-full data-vertical:w-full"
          data-slot="slider-range"
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          className="block size-4 shrink-0 rounded-full border border-primary bg-white shadow-sm ring-ring/50 transition-[color,box-shadow] ease-snappy select-none hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
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
