import { cn } from "@codefast/ui/lib/utils";
import { Skeleton } from "@codefast/ui/skeleton";
import { BoxIcon } from "lucide-react";

interface PreviewSkeletonProps {
  readonly minHeight?: number;
  readonly className?: string;
}

/** Placeholder shown before a gallery demo mounts — avoids an empty preview pane. */
export function PreviewSkeleton({ minHeight = 160, className }: PreviewSkeletonProps) {
  return (
    <Skeleton
      className={cn("flex items-center justify-center rounded-none", className)}
      style={{ minHeight }}
      aria-hidden
    >
      <BoxIcon className="size-6 text-ui-muted/40" />
    </Skeleton>
  );
}
