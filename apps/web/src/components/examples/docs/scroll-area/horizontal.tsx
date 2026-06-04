import { ScrollArea } from "@codefast/ui/scroll-area";

const COVERS = Array.from({ length: 10 }, (_, index) => ({
  id: index,
  title: `Track ${index + 1}`,
}));

export function ScrollAreaHorizontal() {
  return (
    <ScrollArea className="w-full max-w-sm rounded-xl border border-ui-border">
      <div className="flex gap-3 p-3">
        {COVERS.map((cover) => (
          <figure key={cover.id} className="shrink-0">
            <div className="size-28 rounded-lg bg-gradient-to-br from-ui-brand/30 to-ui-surface" />
            <figcaption className="mt-1.5 text-xs text-ui-muted">{cover.title}</figcaption>
          </figure>
        ))}
      </div>
    </ScrollArea>
  );
}
