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
      className={cn('relative flex w-full touch-none select-none items-center', 'data-disabled:opacity-50', className)}
      {...props}
    >
      <SliderPrimitive.Track className="bg-muted relative h-1 w-full grow overflow-hidden rounded-full">
        <SliderPrimitive.Range className="bg-primary absolute h-full" />
      </SliderPrimitive.Track>

      {(props.value ?? props.defaultValue ?? []).map((_, index) => (
        <SliderPrimitive.Thumb
          // eslint-disable-next-line react/no-array-index-key -- index is stable
          key={index}
          className={cn(
            'border-primary bg-primary shadow-xs flex size-4 items-center justify-center rounded-full border-2 transition',
            'after:bg-background after:size-full after:rounded-full after:transition-[width,height]',
            'active:not-data-disabled:after:size-1',
            'focus-visible:ring-ring/40 focus-visible:ring-3 focus-visible:outline-none',
          )}
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
