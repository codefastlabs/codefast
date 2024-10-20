import * as SliderPrimitive from '@radix-ui/react-slider';
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef } from 'react';

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
          'border-primary bg-background size-4.5 relative flex items-center justify-center rounded-full border-2 shadow transition',
          'active:bg-primary',
          'active:after:bg-background active:after:absolute active:after:size-1 active:after:rounded-full',
          'focus-visible:ring-ring/40 focus-visible:outline-none focus-visible:ring-2',
          'disabled:pointer-events-none disabled:opacity-50',
        )}
        {...(props.tabIndex !== undefined ? { tabIndex: props.tabIndex } : undefined)}
      />
    ))}
  </SliderPrimitive.Root>
));

Slider.displayName = SliderPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Slider, type SliderProps };
