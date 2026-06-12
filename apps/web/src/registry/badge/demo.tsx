import { Badge } from "@codefast/ui/badge";

const PULLS = [
  { title: "feat: dark mode toggle", status: "Merged", variant: "default" as const },
  { title: "fix: focus ring contrast", status: "In review", variant: "secondary" as const },
  { title: "chore: bump dependencies", status: "Closed", variant: "outline" as const },
];

export function BadgeDemo() {
  return (
    <div className="w-full max-w-xs space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ui-fg">Pull requests</span>
        <Badge variant="secondary">3 open</Badge>
      </div>
      <ul className="space-y-2">
        {PULLS.map(({ title, status, variant }) => (
          <li key={title} className="flex items-center justify-between gap-3">
            <span className="truncate font-mono text-xs text-ui-muted">{title}</span>
            <Badge variant={variant}>
              <span className="size-1.5 rounded-full bg-current" />
              {status}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
