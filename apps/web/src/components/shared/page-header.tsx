import { cn } from "@codefast/ui/lib/utils";
import type { ReactNode } from "react";

interface PageHeaderProps {
  readonly eyebrow?: ReactNode;
  readonly title: ReactNode;
  readonly description?: string;
  readonly className?: string;
  readonly animate?: boolean;
}

/** Eyebrow → title → description pattern shared by docs and marketing pages. */
export function PageHeader({ eyebrow, title, description, className, animate = true }: PageHeaderProps) {
  return (
    <section className={cn("max-w-2xl", animate && "page-enter", className)}>
      {eyebrow ? <div className="mb-5">{eyebrow}</div> : null}
      <h1 className="mb-5 text-3xl leading-none font-bold tracking-tight text-ui-fg sm:text-4xl md:text-5xl md:tracking-tighter lg:text-6xl">
        {title}
      </h1>
      {description ? <p className="text-base leading-relaxed text-ui-muted">{description}</p> : null}
    </section>
  );
}
