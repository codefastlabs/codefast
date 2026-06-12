import { Skeleton } from "@codefast/ui/skeleton";

export function SkeletonDemo() {
  return (
    <div className="grid w-full max-w-lg gap-4 sm:grid-cols-2">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-xl bg-ui-card p-3 shadow-sm ring-1 ring-ui-border">
          <Skeleton className="mb-3 h-24 w-full rounded-lg" />
          <div className="mb-3 flex items-center gap-2">
            <Skeleton className="size-7 shrink-0 rounded-full" />
            <Skeleton className="h-2.5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-2 w-3/4 rounded-full" />
          <Skeleton className="mt-1.5 h-2 w-1/2 rounded-full" />
        </div>
      ))}
    </div>
  );
}
