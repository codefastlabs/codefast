import { ScrollArea } from "@codefast/ui/scroll-area";

const TAGS = Array.from({ length: 24 }, (_, index) => `v1.2.${index}`);

export function ScrollAreaList() {
  return (
    <ScrollArea className="h-44 w-48 rounded-xl border border-ui-border">
      <div className="p-3">
        <p className="mb-2 text-xs font-semibold text-ui-fg">Tags</p>
        {TAGS.map((tag) => (
          <p key={tag} className="border-b border-ui-border/60 py-1.5 text-xs text-ui-muted">
            {tag}
          </p>
        ))}
      </div>
    </ScrollArea>
  );
}
