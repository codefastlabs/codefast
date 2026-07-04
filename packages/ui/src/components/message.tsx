import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: MessageGroup
 * -------------------------------------------------------------------------- */

/**
 * Vertical stack of related messages.
 */
type MessageGroupProps = ComponentProps<"div">;

function MessageGroup({ className, ...props }: MessageGroupProps): JSX.Element {
  return <div className={cn("flex min-w-0 flex-col gap-2", className)} data-slot="message-group" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: Message
 * -------------------------------------------------------------------------- */

/**
 * A single message row. `align="end"` mirrors the row for the current author.
 */
interface MessageProps extends ComponentProps<"div"> {
  align?: "start" | "end";
}

function Message({ align = "start", className, ...props }: MessageProps): JSX.Element {
  return (
    <div
      className={cn(
        "group/message relative flex w-full min-w-0 gap-2 text-sm data-[align=end]:flex-row-reverse",
        className,
      )}
      data-align={align}
      data-slot="message"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: MessageAvatar
 * -------------------------------------------------------------------------- */

/**
 * Author avatar; lifts above the footer when a message footer is present.
 */
type MessageAvatarProps = ComponentProps<"div">;

function MessageAvatar({ className, ...props }: MessageAvatarProps): JSX.Element {
  return (
    <div
      className={cn(
        "flex w-fit min-w-8 shrink-0 items-center justify-center self-end overflow-hidden rounded-full bg-muted group-has-data-[slot=message-footer]/message:-translate-y-8",
        className,
      )}
      data-slot="message-avatar"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: MessageContent
 * -------------------------------------------------------------------------- */

/**
 * Column holding the message bubbles and metadata.
 */
type MessageContentProps = ComponentProps<"div">;

function MessageContent({ className, ...props }: MessageContentProps): JSX.Element {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-col gap-2.5 wrap-break-word group-data-[align=end]/message:*:data-slot:self-end",
        className,
      )}
      data-slot="message-content"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: MessageHeader
 * -------------------------------------------------------------------------- */

/**
 * Metadata above the bubbles (author, timestamp).
 */
type MessageHeaderProps = ComponentProps<"div">;

function MessageHeader({ className, ...props }: MessageHeaderProps): JSX.Element {
  return (
    <div
      className={cn(
        "flex max-w-full min-w-0 items-center px-3 text-xs font-medium text-muted-foreground group-has-data-[variant=ghost]/message:px-0",
        className,
      )}
      data-slot="message-header"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: MessageFooter
 * -------------------------------------------------------------------------- */

/**
 * Metadata below the bubbles (status, reactions); aligns with the row.
 */
type MessageFooterProps = ComponentProps<"div">;

function MessageFooter({ className, ...props }: MessageFooterProps): JSX.Element {
  return (
    <div
      className={cn(
        "flex max-w-full min-w-0 items-center px-3 text-xs font-medium text-muted-foreground group-has-data-[variant=ghost]/message:px-0 group-data-[align=end]/message:justify-end",
        className,
      )}
      data-slot="message-footer"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Message, MessageAvatar, MessageContent, MessageFooter, MessageGroup, MessageHeader };
export type {
  MessageAvatarProps,
  MessageContentProps,
  MessageFooterProps,
  MessageGroupProps,
  MessageHeaderProps,
  MessageProps,
};
