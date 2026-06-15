/** Layout-stable placeholder while a detail chunk streams in. */
export function DetailSkeleton() {
  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_180px] xl:gap-12">
      <div className="min-w-0 space-y-16">
        <div className="min-h-64 animate-pulse rounded-2xl border border-ui-border/60 bg-ui-surface" />
        <div className="min-h-40 animate-pulse rounded-2xl border border-ui-border/60 bg-ui-surface" />
      </div>
      <aside className="hidden xl:block">
        <div className="min-h-48 animate-pulse rounded-xl border border-ui-border/60 bg-ui-surface" />
      </aside>
    </div>
  );
}
