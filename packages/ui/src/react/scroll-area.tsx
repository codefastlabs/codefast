'use client';

import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { createContextScope, type Scope } from '@radix-ui/react-context';
import { tv, type VariantProps } from 'tailwind-variants';
import { cn } from '../lib/utils';

/* -----------------------------------------------------------------------------
 * Component: ScrollArea
 * -------------------------------------------------------------------------- */

const SCROLL_AREA_NAME = 'ScrollArea';

type ScopedProps<P> = P & { __scopeScrollArea?: Scope };

const [createCarouselContext] = createContextScope(SCROLL_AREA_NAME);

type ScrollAreaContextValue = Pick<ScrollAreaScrollbarVariantsProps, 'size'>;

const [CarouselProvider, useCarouselContext] = createCarouselContext<ScrollAreaContextValue>(SCROLL_AREA_NAME);

type ScrollAreaElement = React.ElementRef<typeof ScrollAreaPrimitive.Root>;
type ScrollAreaProps = React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & ScrollAreaContextValue;

const ScrollArea = React.forwardRef<ScrollAreaElement, ScrollAreaProps>(
  ({ __scopeScrollArea, children, className, size = '2', ...props }: ScopedProps<ScrollAreaProps>, forwardedRef) => (
    <CarouselProvider scope={__scopeScrollArea} size={size}>
      <ScrollAreaPrimitive.Root ref={forwardedRef} className={cn('relative overflow-hidden', className)} {...props}>
        <ScrollAreaPrimitive.Viewport className="size-full rounded-[inherit] [&>*]:h-full">
          {children}
        </ScrollAreaPrimitive.Viewport>
        <ScrollAreaScrollbar orientation="vertical" />
        <ScrollAreaScrollbar orientation="horizontal" />
        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    </CarouselProvider>
  ),
);

ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Variant: ScrollAreaScrollbar
 * -------------------------------------------------------------------------- */

const scrollAreaScrollbarVariants = tv({
  base: 'flex touch-none select-none p-px transition',
  variants: {
    orientation: {
      vertical: 'h-full flex-row border-l border-l-transparent',
      horizontal: 'w-full flex-col border-t border-t-transparent',
    },
    size: {
      none: '',
      '1': '',
      '2': '',
      '3': '',
    },
  },
  compoundVariants: [
    { orientation: 'vertical', size: '1', className: 'w-1.5' },
    { orientation: 'vertical', size: '2', className: 'w-2' },
    { orientation: 'vertical', size: '3', className: 'w-2.5' },
    { orientation: 'horizontal', size: '1', className: 'h-1.5' },
    { orientation: 'horizontal', size: '2', className: 'h-2' },
    { orientation: 'horizontal', size: '3', className: 'h-2.5' },
  ],
});

type ScrollAreaScrollbarVariantsProps = VariantProps<typeof scrollAreaScrollbarVariants>;

/* -----------------------------------------------------------------------------
 * Component: ScrollAreaScrollbar
 * -------------------------------------------------------------------------- */

type ScrollAreaScrollbarElement = React.ElementRef<typeof ScrollAreaPrimitive.Scrollbar>;
type ScrollAreaScrollbarProps = React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Scrollbar>;

const ScrollAreaScrollbar = React.forwardRef<ScrollAreaScrollbarElement, ScrollAreaScrollbarProps>(
  (
    { __scopeScrollArea, className, orientation = 'vertical', ...props }: ScopedProps<ScrollAreaScrollbarProps>,
    forwardedRef,
  ) => {
    const { size } = useCarouselContext(SCROLL_AREA_NAME, __scopeScrollArea);

    return (
      <ScrollAreaPrimitive.Scrollbar
        ref={forwardedRef}
        className={scrollAreaScrollbarVariants({ orientation, size, className })}
        orientation={orientation}
        {...props}
      >
        <ScrollAreaPrimitive.ScrollAreaThumb className="bg-border relative flex-1 rounded-full" />
      </ScrollAreaPrimitive.Scrollbar>
    );
  },
);

ScrollAreaScrollbar.displayName = ScrollAreaPrimitive.Scrollbar.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { ScrollArea, ScrollAreaScrollbar, type ScrollAreaProps, type ScrollAreaScrollbarProps };
