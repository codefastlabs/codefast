import { cn } from '@/lib/utils';
import * as SliderPrimitive from '@radix-ui/react-slider';
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
} from 'react';

/* -----------------------------------------------------------------------------
 * Component: Slider
 * -------------------------------------------------------------------------- */

type SliderElement = ComponentRef<typeof SliderPrimitive.Root>;
type SliderProps = ComponentPropsWithoutRef<typeof SliderPrimitive.Root>;

const Slider = forwardRef<SliderElement, SliderProps>(
  ({ className, ...props }, forwardedRef) => (
    <SliderPrimitive.Root
      ref={forwardedRef}
      className={cn(
        'relative flex w-full touch-none select-none items-center',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="bg-primary/20 relative h-1.5 w-full grow overflow-hidden rounded-full">
        <SliderPrimitive.Range className="bg-primary absolute h-full" />
      </SliderPrimitive.Track>

      {(props.value ?? props.defaultValue ?? []).map((_, index) => (
        <SliderPrimitive.Thumb
          // eslint-disable-next-line react/no-array-index-key -- index is stable
          key={index}
          className={cn(
            'border-primary/50 bg-background block size-4 rounded-full border shadow transition',
            'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1',
            'disabled:pointer-events-none disabled:opacity-50',
          )}
          {...(props.tabIndex !== undefined
            ? { tabIndex: props.tabIndex }
            : undefined)}
        />
      ))}
    </SliderPrimitive.Root>
  ),
);

Slider.displayName = SliderPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Slider, type SliderProps };
