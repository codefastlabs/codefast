import { Skeleton } from "@codefast/ui/skeleton";

export function SkeletonCard() {
  return (
    <div className="w-full max-w-xs rounded-xl bg-ui-card p-3 shadow-sm ring-1 ring-ui-border">
      <Skeleton className="mb-3 h-28 w-full rounded-lg" />
      <div className="mb-3 flex items-center gap-2">
        <Skeleton className="size-8 shrink-0 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-2.5 w-24 rounded-full" />
          <Skeleton className="h-2 w-16 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-2 w-3/4 rounded-full" />
      <Skeleton className="mt-1.5 h-2 w-1/2 rounded-full" />
    </div>
  );
}
