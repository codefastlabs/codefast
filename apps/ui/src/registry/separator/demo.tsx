import { Separator } from "@codefast/ui/separator";

export function SeparatorDemo() {
  return (
    <div className="w-full max-w-xs">
      <div className="space-y-1">
        <p className="text-sm font-medium text-ui-fg">@codefast/ui</p>
        <p className="text-xs text-ui-muted">Open-source React components.</p>
      </div>
      <Separator className="my-4" />
      <div className="flex items-center gap-4 text-xs text-ui-muted">
        <span>Blog</span>
        <Separator orientation="vertical" className="h-3" />
        <span>Docs</span>
        <Separator orientation="vertical" className="h-3" />
        <span>Source</span>
      </div>
    </div>
  );
}
