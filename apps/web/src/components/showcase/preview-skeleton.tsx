import { cn } from "@codefast/ui/lib/utils";
import { Skeleton } from "@codefast/ui/skeleton";
import { BoxIcon } from "lucide-react";
import type { ComponentProps } from "react";

interface PreviewSkeletonProps extends ComponentProps<typeof Skeleton> {
  readonly minHeight?: number;
}

/** Placeholder shown before a gallery demo mounts — avoids an empty preview pane. */
export function PreviewSkeleton({ minHeight = 112, className, style, ...props }: PreviewSkeletonProps) {
  return (
    <Skeleton
      aria-hidden
      className={cn("flex items-center justify-center rounded-none", className)}
      style={{ minHeight, ...style }}
      {...props}
    >
      <BoxIcon className="size-6 text-ui-muted/40" />
    </Skeleton>
  );
}
