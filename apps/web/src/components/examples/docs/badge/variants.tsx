import { Badge } from "@codefast/ui/badge";

export function BadgeVariants() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="ghost">Ghost</Badge>
    </div>
  );
}
