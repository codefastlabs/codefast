import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps, ReactElement } from "react";

interface DemoSectionProps extends ComponentProps<"section"> {
  title: string;
  description?: string | undefined;
}

export function DemoSection({ title, description, className, children, ...props }: DemoSectionProps): ReactElement {
  return (
    <section className={cn("space-y-4", className)} {...props}>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
