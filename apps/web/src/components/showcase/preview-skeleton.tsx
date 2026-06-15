import { cn } from "@codefast/ui/lib/utils";
import { BoxIcon } from "lucide-react";

interface PreviewSkeletonProps {
  readonly minHeight?: number;
  readonly className?: string;
}

/** Placeholder shown before a gallery demo mounts — avoids an empty preview pane. */
export function PreviewSkeleton({ minHeight = 160, className }: PreviewSkeletonProps) {
  return (
    <div
      className={cn("flex animate-pulse items-center justify-center bg-ui-surface", className)}
      style={{ minHeight }}
      aria-hidden
    >
      <BoxIcon className="size-6 text-ui-muted/40" />
    </div>
  );
}
