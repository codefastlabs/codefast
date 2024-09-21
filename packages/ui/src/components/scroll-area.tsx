'use client';

import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { createContextScope, type Scope } from '@radix-ui/react-context';
import { scrollAreaVariants, type ScrollAreaVariantsProps } from '@/styles/scroll-area-variants';

/* -----------------------------------------------------------------------------
 * Variant: ScrollArea
 * -------------------------------------------------------------------------- */

const { root, viewport, scrollbar, scrollAreaThumb } = scrollAreaVariants();

/* -----------------------------------------------------------------------------
 * Component: ScrollArea
 * -------------------------------------------------------------------------- */

const SCROLL_AREA_NAME = 'ScrollArea';

type ScopedProps<P> = P & { __scopeScrollArea?: Scope };

const [createScrollAreaContext] = createContextScope(SCROLL_AREA_NAME);

type ScrollAreaContextValue = Pick<ScrollAreaVariantsProps, 'size'>;

const [ScrollAreaProvider, useScrollAreaContext] = createScrollAreaContext<ScrollAreaContextValue>(SCROLL_AREA_NAME);

type ScrollAreaElement = React.ElementRef<typeof ScrollAreaPrimitive.Root>;
type ScrollAreaProps = React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & ScrollAreaContextValue;

const ScrollArea = React.forwardRef<ScrollAreaElement, ScrollAreaProps>(
  ({ __scopeScrollArea, children, className, size, ...props }: ScopedProps<ScrollAreaProps>, forwardedRef) => (
    <ScrollAreaProvider scope={__scopeScrollArea} size={size}>
      <ScrollAreaPrimitive.Root ref={forwardedRef} className={root({ className })} {...props}>
        <ScrollAreaPrimitive.Viewport className={viewport()}>{children}</ScrollAreaPrimitive.Viewport>
        <ScrollAreaScrollbar orientation="vertical" />
        <ScrollAreaScrollbar orientation="horizontal" />
        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    </ScrollAreaProvider>
  ),
);

ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

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
    const { size } = useScrollAreaContext(SCROLL_AREA_NAME, __scopeScrollArea);

    return (
      <ScrollAreaPrimitive.Scrollbar
        ref={forwardedRef}
        className={scrollbar({ orientation, size, className })}
        orientation={orientation}
        {...props}
      >
        <ScrollAreaPrimitive.ScrollAreaThumb className={scrollAreaThumb()} />
      </ScrollAreaPrimitive.Scrollbar>
    );
  },
);

ScrollAreaScrollbar.displayName = ScrollAreaPrimitive.Scrollbar.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { ScrollArea, ScrollAreaScrollbar, type ScrollAreaProps, type ScrollAreaScrollbarProps };
