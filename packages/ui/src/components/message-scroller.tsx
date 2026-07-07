import { ArrowDownIcon } from "lucide-react";
import type { ComponentProps, JSX } from "react";

import { Button } from "#/components/button";
import { cn } from "#/lib/utils";
import {
  MessageScroller as MessageScrollerPrimitive,
  MessageScrollerButton as MessageScrollerButtonPrimitive,
  MessageScrollerContent as MessageScrollerContentPrimitive,
  MessageScrollerItem as MessageScrollerItemPrimitive,
  MessageScrollerProvider as MessageScrollerProviderPrimitive,
  MessageScrollerViewport as MessageScrollerViewportPrimitive,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
} from "#/primitives/message-scroller";

/* -----------------------------------------------------------------------------
 * Component: MessageScrollerProvider
 * -------------------------------------------------------------------------- */

/**
 * Owns scroll behavior for a transcript. Renders no DOM; wrap the frame.
 *
 * @since 0.5.0-canary.3
 */
type MessageScrollerProviderProps = ComponentProps<typeof MessageScrollerProviderPrimitive>;

/**
 * @since 0.5.0-canary.3
 */
function MessageScrollerProvider(props: MessageScrollerProviderProps): JSX.Element {
  return <MessageScrollerProviderPrimitive {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: MessageScroller
 * -------------------------------------------------------------------------- */

/**
 * Frame for a chat transcript scroller; must sit inside a provider.
 *
 * @since 0.5.0-canary.3
 */
type MessageScrollerProps = ComponentProps<typeof MessageScrollerPrimitive>;

/**
 * @since 0.5.0-canary.3
 */
function MessageScroller({ className, ...props }: MessageScrollerProps): JSX.Element {
  return (
    <MessageScrollerPrimitive
      className={cn("group/message-scroller relative flex size-full min-h-0 flex-col overflow-hidden", className)}
      data-slot="message-scroller"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: MessageScrollerViewport
 * -------------------------------------------------------------------------- */

/**
 * Scrollable viewport; fades its bottom edge and hides the bar while autoscrolling.
 *
 * @since 0.5.0-canary.3
 */
type MessageScrollerViewportProps = ComponentProps<typeof MessageScrollerViewportPrimitive>;

/**
 * @since 0.5.0-canary.3
 */
function MessageScrollerViewport({ className, ...props }: MessageScrollerViewportProps): JSX.Element {
  return (
    <MessageScrollerViewportPrimitive
      className={cn(
        "size-full min-h-0 min-w-0 scroll-fade-b scrollbar-thin scrollbar-gutter-stable overflow-y-auto overscroll-contain contain-content data-autoscrolling:scrollbar-thumb-transparent data-autoscrolling:scrollbar-track-transparent",
        className,
      )}
      data-slot="message-scroller-viewport"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: MessageScrollerContent
 * -------------------------------------------------------------------------- */

/**
 * Column holding the transcript rows.
 *
 * @since 0.5.0-canary.3
 */
type MessageScrollerContentProps = ComponentProps<typeof MessageScrollerContentPrimitive>;

/**
 * @since 0.5.0-canary.3
 */
function MessageScrollerContent({ className, ...props }: MessageScrollerContentProps): JSX.Element {
  return (
    <MessageScrollerContentPrimitive
      className={cn("flex h-max min-h-full flex-col gap-6", className)}
      data-slot="message-scroller-content"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: MessageScrollerItem
 * -------------------------------------------------------------------------- */

/**
 * One transcript row; opts into content-visibility for long feeds.
 *
 * @since 0.5.0-canary.3
 */
type MessageScrollerItemProps = ComponentProps<typeof MessageScrollerItemPrimitive>;

/**
 * @since 0.5.0-canary.3
 */
function MessageScrollerItem({ className, isScrollAnchor = false, ...props }: MessageScrollerItemProps): JSX.Element {
  return (
    <MessageScrollerItemPrimitive
      className={cn("min-w-0 shrink-0 [contain-intrinsic-size:auto_10rem] [content-visibility:auto]", className)}
      data-slot="message-scroller-item"
      isScrollAnchor={isScrollAnchor}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: MessageScrollerButton
 * -------------------------------------------------------------------------- */

/**
 * Scroll-to-edge control; hides itself when there is no overflow that way.
 *
 * @since 0.5.0-canary.3
 */
type MessageScrollerButtonProps = ComponentProps<typeof MessageScrollerButtonPrimitive> &
  Pick<ComponentProps<typeof Button>, "size" | "variant">;

/**
 * @since 0.5.0-canary.3
 */
function MessageScrollerButton({
  children,
  className,
  direction = "end",
  render,
  size = "icon-sm",
  variant = "secondary",
  ...props
}: MessageScrollerButtonProps): JSX.Element {
  return (
    <MessageScrollerButtonPrimitive
      className={cn(
        "absolute inset-s-1/2 -translate-x-1/2 border-border bg-background text-foreground transition-[translate,scale,opacity] duration-200 hover:bg-muted hover:text-foreground data-[active=false]:pointer-events-none data-[active=false]:scale-95 data-[active=false]:opacity-0 data-[active=false]:duration-400 data-[active=false]:ease-[cubic-bezier(0.7,0,0.84,0)] data-[active=true]:translate-y-0 data-[active=true]:scale-100 data-[active=true]:opacity-100 data-[active=true]:ease-[cubic-bezier(0.23,1,0.32,1)] data-[direction=end]:bottom-4 data-[direction=end]:data-[active=false]:translate-y-full data-[direction=start]:top-4 data-[direction=start]:data-[active=false]:-translate-y-full rtl:translate-x-1/2 data-[direction=start]:[&_svg]:rotate-180",
        className,
      )}
      data-direction={direction}
      data-size={size}
      data-slot="message-scroller-button"
      data-variant={variant}
      direction={direction}
      render={render ?? <Button size={size} variant={variant} />}
      {...props}
    >
      {children ?? (
        <>
          <ArrowDownIcon />
          <span className="sr-only">{direction === "end" ? "Scroll to end" : "Scroll to start"}</span>
        </>
      )}
    </MessageScrollerButtonPrimitive>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
};
export type {
  MessageScrollerButtonProps,
  MessageScrollerContentProps,
  MessageScrollerItemProps,
  MessageScrollerProps,
  MessageScrollerProviderProps,
  MessageScrollerViewportProps,
};
export type {
  MessageScrollerDefaultScrollPosition,
  MessageScrollerScrollAlign,
  MessageScrollerScrollable,
  MessageScrollerScrollOptions,
  MessageScrollerVisibilityState,
} from "#/lib/message-scroller/types";
