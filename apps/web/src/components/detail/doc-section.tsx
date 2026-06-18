import { cn } from "@codefast/ui/lib/utils";
import type { ReactNode } from "react";

interface DocSectionProps {
  /** Anchor id — must match the matching entry in the On-this-page TOC. */
  readonly id: string;
  readonly title: string;
  readonly description?: string | undefined;
  readonly children: ReactNode;
  readonly className?: string | undefined;
}

/**
 * A titled, anchored documentation section. The heading is a deep-link target
 * (scroll-margin clears the sticky header) and exposes a hover affordance to
 * copy the section URL, matching the per-component detail layout.
 */
export function DocSection({ id, title, description, children, className }: DocSectionProps) {
  const titleId = `${id}-title`;

  return (
    <section id={id} aria-labelledby={titleId} className={cn("scroll-mt-anchor", className)}>
      <a href={`#${id}`} className="group/anchor mb-1 flex w-fit items-center gap-2 no-underline">
        <h2 id={titleId} className="text-2xl font-bold tracking-tighter text-ui-fg">
          {title}
        </h2>
        <span aria-hidden className="text-ui-muted opacity-0 transition-opacity group-hover/anchor:opacity-100">
          #
        </span>
      </a>
      {description ? (
        <p className="mb-6 max-w-2xl text-sm leading-relaxed text-ui-muted">{description}</p>
      ) : (
        <div className="mb-6" />
      )}
      {children}
    </section>
  );
}
