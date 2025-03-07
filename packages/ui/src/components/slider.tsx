import type { ComponentProps, JSX } from 'react';

import * as SliderPrimitive from '@radix-ui/react-slider';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Slider
 * -------------------------------------------------------------------------- */

type SliderProps = ComponentProps<typeof SliderPrimitive.Root>;

function Slider({ className, ...props }: SliderProps): JSX.Element {
  return (
    <SliderPrimitive.Root
      className={cn('data-disabled:opacity-50 relative flex w-full touch-none select-none items-center', className)}
      data-slot="slider"
      {...props}
    >
      <SliderPrimitive.Track
        className="bg-muted relative h-1 w-full grow overflow-hidden rounded-full"
        data-slot="slider-track"
      >
        <SliderPrimitive.Range className="bg-primary absolute h-full" data-slot="slider-range" />
      </SliderPrimitive.Track>

      {(props.value ?? props.defaultValue ?? []).map((_, index) => (
        <SliderPrimitive.Thumb
          // eslint-disable-next-line react/no-array-index-key -- index is stable
          key={index}
          className={cn(
            'border-primary bg-primary after:bg-background active:not-data-disabled:after:size-1 focus-visible:ring-ring focus-visible:ring-3 flex size-4 items-center justify-center rounded-full border-2 shadow-sm transition after:size-full after:rounded-full after:transition-[width,height] focus-visible:outline-none',
          )}
          data-slot="slider-thumb"
          {...(props.tabIndex === undefined ? undefined : { tabIndex: props.tabIndex })}
        />
      ))}
    </SliderPrimitive.Root>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { SliderProps };
export { Slider };
