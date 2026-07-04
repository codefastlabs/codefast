import { Slot } from "radix-ui";
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
 */
interface AttachmentProps extends ComponentProps<"div">, AttachmentVariants {
  state?: "idle" | "uploading" | "processing" | "error" | "done";
}

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
 */
interface AttachmentMediaProps extends ComponentProps<"div">, AttachmentMediaVariants {}

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
 */
type AttachmentContentProps = ComponentProps<"div">;

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
 */
type AttachmentTitleProps = ComponentProps<"span">;

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
 */
type AttachmentDescriptionProps = ComponentProps<"span">;

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
 */
type AttachmentActionsProps = ComponentProps<"div">;

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
 */
interface AttachmentActionProps extends ComponentProps<typeof Button> {}

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
 */
interface AttachmentTriggerProps extends ComponentProps<"button"> {
  asChild?: boolean;
}

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
 */
type AttachmentGroupProps = ComponentProps<"div">;

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
