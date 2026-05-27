import { Separator } from "@codefast/ui/separator";

export function SeparatorDemo() {
  return (
    <div className="w-full max-w-xs">
      <div className="space-y-1">
        <p className="text-sm font-medium text-(--sea-ink)">@codefast/ui</p>
        <p className="text-xs text-(--sea-ink-soft)">Open-source React components.</p>
      </div>
      <Separator className="my-4" />
      <div className="flex items-center gap-4 text-xs text-(--sea-ink-soft)">
        <span>Blog</span>
        <Separator orientation="vertical" className="h-3" />
        <span>Docs</span>
        <Separator orientation="vertical" className="h-3" />
        <span>Source</span>
      </div>
    </div>
  );
}
