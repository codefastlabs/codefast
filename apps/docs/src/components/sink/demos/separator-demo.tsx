import { cn } from "@codefast/tailwind-variants";
import { Separator } from "@codefast/ui/separator";

export function SeparatorDemo() {
  return (
    <div>
      <div className="flex flex-col gap-1">
        <div className="text-sm leading-none font-medium">Tailwind CSS</div>
        <div className="text-sm text-muted-foreground">A utility-first CSS framework.</div>
      </div>
      <Separator className="my-4" />
      <div className={cn("flex h-5 items-center gap-4", "text-sm")}>
        <div>Blog</div>
        <Separator orientation="vertical" />
        <div>Docs</div>
        <Separator orientation="vertical" />
        <div>Source</div>
      </div>
    </div>
  );
}
