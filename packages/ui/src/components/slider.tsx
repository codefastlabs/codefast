import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import { Slider as SliderPrimitive } from "radix-ui";
import { useMemo } from "react";

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
        "relative flex w-full touch-none items-center select-none data-vertical:h-full data-vertical:min-h-44 data-vertical:w-auto data-vertical:flex-col data-disabled:opacity-50",
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
        className="relative w-full grow overflow-hidden rounded-full bg-muted data-horizontal:h-1.5 data-horizontal:w-full data-vertical:h-full data-vertical:w-1.5"
        data-slot="slider-track"
      >
        <SliderPrimitive.Range
          className="absolute bg-primary data-horizontal:h-full data-vertical:w-full"
          data-slot="slider-range"
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          aria-label="Volume"
          className="flex size-4 items-center justify-center rounded-full border-2 border-primary bg-primary shadow-sm ring-ring/50 outline-hidden transition-[color,box-shadow] after:size-full after:rounded-full after:bg-background after:transition-[width,height] after:duration-200 after:ease-spring hover:ring-4 focus-visible:ring-4 active:not-data-disabled:after:size-1 motion-reduce:transition-none motion-reduce:after:transition-none motion-reduce:after:duration-0"
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
