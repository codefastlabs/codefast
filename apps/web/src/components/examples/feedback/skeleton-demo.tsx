import { cn } from "@codefast/tailwind-variants";
import { Skeleton } from "@codefast/ui/skeleton";

export function SkeletonDemo() {
  return (
    <div className={cn("grid w-full max-w-lg gap-4", "sm:grid-cols-2")}>
      {[0, 1].map((i) => (
        <div key={i} className={cn("p-3", "rounded-xl ring-1 ring-border", "bg-card shadow-sm")}>
          <Skeleton className={cn("mb-3 h-24 w-full", "rounded-lg")} />
          <div className={cn("flex items-center gap-2", "mb-3")}>
            <Skeleton className={cn("size-7 shrink-0", "rounded-full")} />
            <Skeleton className={cn("h-2.5 w-24", "rounded-full")} />
          </div>
          <Skeleton className={cn("h-2 w-3/4", "rounded-full")} />
          <Skeleton className={cn("mt-1.5 h-2 w-1/2", "rounded-full")} />
        </div>
      ))}
    </div>
  );
}
