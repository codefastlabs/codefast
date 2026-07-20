import * as Slot from "radix-ui/slot";
import type { ComponentProps, JSX } from "react";

import { Button } from "#/components/button";
import { cn } from "#/lib/utils";
import type { AttachmentMediaVariants, AttachmentVariants } from "#/variants/attachment";
import { attachmentMediaVariants, attachmentVariants } from "#/variants/attachment";

/* -----------------------------------------------------------------------------
 * Component: Attachment
 * -------------------------------------------------------------------------- */

/**
 * File/media attachment card. `state` drives the upload lifecycle styling.
 *
 * @since 0.5.0-canary.3
 */
interface AttachmentProps extends ComponentProps<"div">, AttachmentVariants {
  state?: "idle" | "uploading" | "processing" | "error" | "done";
}

/**
 * @since 0.5.0-canary.3
 */
function Attachment({
  className,
  orientation = "horizontal",
  size = "default",
  state = "done",
  ...props
}: AttachmentProps): JSX.Element {
  return (
    <div
      className={attachmentVariants({ className, orientation, size })}
      data-orientation={orientation}
      data-size={size}
      data-slot="attachment"
      data-state={state}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AttachmentMedia
 * -------------------------------------------------------------------------- */

/**
 * Thumbnail slot — an icon tile or a cover image.
 *
 * @since 0.5.0-canary.3
 */
interface AttachmentMediaProps extends ComponentProps<"div">, AttachmentMediaVariants {}

/**
 * @since 0.5.0-canary.3
 */
function AttachmentMedia({ className, variant = "icon", ...props }: AttachmentMediaProps): JSX.Element {
  return (
    <div
      className={attachmentMediaVariants({ className, variant })}
      data-slot="attachment-media"
      data-variant={variant}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AttachmentContent
 * -------------------------------------------------------------------------- */

/**
 * Text column holding the title and description.
 *
 * @since 0.5.0-canary.3
 */
type AttachmentContentProps = ComponentProps<"div">;

/**
 * @since 0.5.0-canary.3
 */
function AttachmentContent({ className, ...props }: AttachmentContentProps): JSX.Element {
  return (
    <div
      className={cn(
        "max-w-full min-w-0 flex-1 leading-tight group-data-[orientation=vertical]/attachment:px-1",
        className,
      )}
      data-slot="attachment-content"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AttachmentTitle
 * -------------------------------------------------------------------------- */

/**
 * File name; shimmers while uploading or processing.
 *
 * @since 0.5.0-canary.3
 */
type AttachmentTitleProps = ComponentProps<"span">;

/**
 * @since 0.5.0-canary.3
 */
function AttachmentTitle({ className, ...props }: AttachmentTitleProps): JSX.Element {
  return (
    <span
      className={cn(
        "block max-w-full min-w-0 truncate font-medium group-data-[state=processing]/attachment:shimmer group-data-[state=uploading]/attachment:shimmer",
        className,
      )}
      data-slot="attachment-title"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AttachmentDescription
 * -------------------------------------------------------------------------- */

/**
 * Secondary line (size, type); turns destructive on error.
 *
 * @since 0.5.0-canary.3
 */
type AttachmentDescriptionProps = ComponentProps<"span">;

/**
 * @since 0.5.0-canary.3
 */
function AttachmentDescription({ className, ...props }: AttachmentDescriptionProps): JSX.Element {
  return (
    <span
      className={cn(
        "mt-0.5 block max-w-full min-w-0 truncate text-xs text-muted-foreground group-data-[state=error]/attachment:text-destructive/80",
        className,
      )}
      data-slot="attachment-description"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AttachmentActions
 * -------------------------------------------------------------------------- */

/**
 * Action cluster; floats to the top corner in the vertical orientation.
 *
 * @since 0.5.0-canary.3
 */
type AttachmentActionsProps = ComponentProps<"div">;

/**
 * @since 0.5.0-canary.3
 */
function AttachmentActions({ className, ...props }: AttachmentActionsProps): JSX.Element {
  return (
    <div
      className={cn(
        "relative z-20 flex shrink-0 items-center group-data-[orientation=vertical]/attachment:absolute group-data-[orientation=vertical]/attachment:end-3 group-data-[orientation=vertical]/attachment:top-3 group-data-[orientation=vertical]/attachment:gap-1",
        className,
      )}
      data-slot="attachment-actions"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AttachmentAction
 * -------------------------------------------------------------------------- */

/**
 * A single action button; defaults to a ghost icon button.
 *
 * @since 0.5.0-canary.3
 */
interface AttachmentActionProps extends ComponentProps<typeof Button> {}

/**
 * @since 0.5.0-canary.3
 */
function AttachmentAction({ className, size = "icon-xs", variant, ...props }: AttachmentActionProps): JSX.Element {
  return (
    <Button
      className={cn(className)}
      data-slot="attachment-action"
      size={size}
      variant={variant ?? "ghost"}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AttachmentTrigger
 * -------------------------------------------------------------------------- */

/**
 * Full-card overlay trigger for opening/previewing the attachment.
 *
 * @since 0.5.0-canary.3
 */
interface AttachmentTriggerProps extends ComponentProps<"button"> {
  asChild?: boolean;
}

/**
 * @since 0.5.0-canary.3
 */
function AttachmentTrigger({ asChild = false, className, type, ...props }: AttachmentTriggerProps): JSX.Element {
  const Component = asChild ? Slot.Root : "button";

  return (
    <Component
      className={cn("absolute inset-0 z-10 outline-none", className)}
      data-slot="attachment-trigger"
      type={asChild ? undefined : (type ?? "button")}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AttachmentGroup
 * -------------------------------------------------------------------------- */

/**
 * Horizontally scrollable row of attachments with snap and edge fade.
 *
 * @since 0.5.0-canary.3
 */
type AttachmentGroupProps = ComponentProps<"div">;

/**
 * @since 0.5.0-canary.3
 */
function AttachmentGroup({ className, ...props }: AttachmentGroupProps): JSX.Element {
  return (
    <div
      className={cn(
        "flex min-w-0 scroll-fade-x snap-x snap-mandatory scroll-px-1 scrollbar-none gap-3 overflow-x-auto overscroll-x-contain py-1 *:data-[slot=attachment]:flex-none *:data-[slot=attachment]:snap-start",
        className,
      )}
      data-slot="attachment-group"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
};
export type {
  AttachmentActionProps,
  AttachmentActionsProps,
  AttachmentContentProps,
  AttachmentDescriptionProps,
  AttachmentGroupProps,
  AttachmentMediaProps,
  AttachmentProps,
  AttachmentTitleProps,
  AttachmentTriggerProps,
};
