import { Skeleton } from "@codefast/ui/skeleton";

export function SkeletonText() {
  return (
    <div className="w-full max-w-xs space-y-2">
      <Skeleton className="h-4 w-2/5 rounded-full" />
      <div className="h-1" />
      <Skeleton className="h-3 w-full rounded-full" />
      <Skeleton className="h-3 w-full rounded-full" />
      <Skeleton className="h-3 w-5/6 rounded-full" />
      <Skeleton className="h-3 w-2/3 rounded-full" />
    </div>
  );
}
