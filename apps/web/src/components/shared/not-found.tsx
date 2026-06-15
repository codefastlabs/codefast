import { Badge } from "@codefast/ui/badge";
import { cn } from "@codefast/ui/lib/utils";
import type { ReactNode } from "react";

interface NotFoundProps {
  readonly badge?: string;
  readonly title: string;
  readonly description: string;
  readonly action?: ReactNode;
  readonly className?: string;
}

/** Centered 404 / missing-resource message reused across route and router boundaries. */
export function NotFound({ badge, title, description, action, className }: NotFoundProps) {
  return (
    <main className={cn("container mx-auto flex flex-col items-center px-4 pt-32 pb-32 text-center", className)}>
      {badge ? (
        <Badge variant="outline" className="mb-5 border-ui-border text-ui-muted">
          {badge}
        </Badge>
      ) : null}
      <h1 className="mb-3 text-3xl font-bold tracking-tight text-ui-fg">{title}</h1>
      <p className={cn("max-w-md text-ui-muted", action && "mb-8")}>{description}</p>
      {action}
    </main>
  );
}
