import type { ComponentPropsWithoutRef, ComponentRef } from 'react';

import * as SliderPrimitive from '@radix-ui/react-slider';
import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Slider
 * -------------------------------------------------------------------------- */

type SliderElement = ComponentRef<typeof SliderPrimitive.Root>;
type SliderProps = ComponentPropsWithoutRef<typeof SliderPrimitive.Root>;

const Slider = forwardRef<SliderElement, SliderProps>(({ className, ...props }, forwardedRef) => (
  <SliderPrimitive.Root
    ref={forwardedRef}
    className={cn('relative flex w-full touch-none select-none items-center', className)}
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
          'active:after:size-1',
          'focus-visible:ring-ring focus-visible:ring-3 focus-visible:outline-none focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
        )}
        {...(props.tabIndex === undefined ? undefined : { tabIndex: props.tabIndex })}
      />
    ))}
  </SliderPrimitive.Root>
));

Slider.displayName = SliderPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { SliderProps };
export { Slider };
