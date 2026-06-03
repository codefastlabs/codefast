import { Skeleton } from "@codefast/ui/skeleton";

export function SkeletonList() {
  return (
    <div className="w-full max-w-xs space-y-3">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center gap-3">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-2.5 w-2/3 rounded-full" />
            <Skeleton className="h-2 w-1/2 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
