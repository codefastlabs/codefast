import { Skeleton } from "@codefast/ui/skeleton";

/** Layout-stable placeholder while a detail chunk streams in. */
export function DetailSkeleton() {
  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_180px] xl:gap-12">
      <div className="min-w-0 space-y-16">
        <Skeleton className="min-h-64 rounded-2xl border border-ui-border/60" />
        <Skeleton className="min-h-40 rounded-2xl border border-ui-border/60" />
      </div>
      <aside className="hidden xl:block">
        <Skeleton className="min-h-48 rounded-xl border border-ui-border/60" />
      </aside>
    </div>
  );
}
