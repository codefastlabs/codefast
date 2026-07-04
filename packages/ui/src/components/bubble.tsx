import { Slot } from "radix-ui";
import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import type { BubbleReactionsVariants, BubbleVariants } from "#/variants/bubble";
import { bubbleReactionsVariants, bubbleVariants } from "#/variants/bubble";

/* -----------------------------------------------------------------------------
 * Component: BubbleGroup
 * -------------------------------------------------------------------------- */

/**
 * Vertical stack of consecutive bubbles from one author.
 */
type BubbleGroupProps = ComponentProps<"div">;

function BubbleGroup({ className, ...props }: BubbleGroupProps): JSX.Element {
  return <div className={cn("flex min-w-0 flex-col gap-2", className)} data-slot="bubble-group" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: Bubble
 * -------------------------------------------------------------------------- */

/**
 * Chat bubble wrapper. `variant` colors the content; `align` sets the side.
 */
interface BubbleProps extends ComponentProps<"div">, BubbleVariants {
  align?: "start" | "end";
}

function Bubble({ align = "start", className, variant = "default", ...props }: BubbleProps): JSX.Element {
  return (
    <div
      className={bubbleVariants({ className, variant })}
      data-align={align}
      data-slot="bubble"
      data-variant={variant}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: BubbleContent
 * -------------------------------------------------------------------------- */

/**
 * The bubble's colored surface; render as a button/link with `asChild`.
 */
interface BubbleContentProps extends ComponentProps<"div"> {
  asChild?: boolean;
}

function BubbleContent({ asChild = false, className, ...props }: BubbleContentProps): JSX.Element {
  const Component = asChild ? Slot.Root : "div";

  return (
    <Component
      className={cn(
        "w-fit max-w-full min-w-0 overflow-hidden rounded-xl border border-transparent px-3 py-2 text-sm leading-relaxed wrap-break-word group-data-[align=end]/bubble:self-end [button]:text-start [button,a]:transition-colors [button,a]:outline-none [button,a]:focus-visible:border-ring [button,a]:focus-visible:ring-3 [button,a]:focus-visible:ring-ring/50",
        className,
      )}
      data-slot="bubble-content"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: BubbleReactions
 * -------------------------------------------------------------------------- */

/**
 * Reaction pill overlapping a bubble corner.
 */
interface BubbleReactionsProps extends ComponentProps<"div">, BubbleReactionsVariants {}

function BubbleReactions({ align = "end", className, side = "bottom", ...props }: BubbleReactionsProps): JSX.Element {
  return (
    <div
      className={bubbleReactionsVariants({ align, className, side })}
      data-align={align}
      data-side={side}
      data-slot="bubble-reactions"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Bubble, BubbleContent, BubbleGroup, BubbleReactions };
export type { BubbleContentProps, BubbleGroupProps, BubbleProps, BubbleReactionsProps };
