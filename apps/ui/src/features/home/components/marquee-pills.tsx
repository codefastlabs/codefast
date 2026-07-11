import { cn } from "@codefast/ui/lib/utils";
import { Link } from "@tanstack/react-router";

import type { ComponentMeta } from "#/registry/_core/components";

interface MarqueePillsProps {
  readonly components: ReadonlyArray<ComponentMeta>;
  /** Marks this copy as the seamless-loop filler: hidden from a11y, unfocusable, dropped under reduced motion. */
  readonly decorative?: boolean;
}

/** One copy of a marquee row's component-pill links. */
export function MarqueePills({ components, decorative = false }: MarqueePillsProps) {
  return (
    <div
      aria-hidden={decorative || undefined}
      className={cn(
        "flex gap-2 pe-2",
        decorative ? "motion-reduce:hidden" : "motion-reduce:flex-wrap motion-reduce:justify-center",
      )}
    >
      {components.map(({ slug, name }) => (
        <Link
          key={slug}
          to="/components/$slug"
          params={{ slug }}
          tabIndex={decorative ? -1 : undefined}
          className="shrink-0 rounded-full border border-ui-inverse/15 bg-ui-inverse/5 px-3 py-1.5 text-xs whitespace-nowrap text-ui-inverse/60 no-underline transition-colors duration-200 hover:border-ui-brand/50 hover:text-ui-inverse"
        >
          {name}
        </Link>
      ))}
    </div>
  );
}
