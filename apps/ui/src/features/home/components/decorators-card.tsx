import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

import { CodeBlock } from "#/components/shared/code-block";

interface DecoratorsCardProps extends Omit<ComponentProps<"article">, "children"> {
  /** Every decorator in one class, as dual-theme highlighted HTML. */
  readonly decoratorsHtml: string;
}

/** Native decorators: dependencies and lifecycle declared where they are consumed, nothing reflected at runtime. */
export function DecoratorsCard({ decoratorsHtml, className, ...props }: DecoratorsCardProps) {
  return (
    <article
      className={cn("flex flex-col gap-5 rounded-2xl border border-ui-border/60 bg-ui-card p-6 sm:p-8", className)}
      {...props}
    >
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-sm text-ui-brand tabular-nums">02</span>
        <h3 className="text-base font-semibold text-ui-fg">Native Stage 3 decorators</h3>
      </div>
      <p className="text-sm leading-relaxed text-ui-muted">
        Six decorators cover dependencies and lifecycle: a required token, an optional one, every binding of a token, a
        named slot, and the two hooks. No reflect-metadata, no experimentalDecorators, no runtime reflection.
      </p>
      <div className="overflow-hidden rounded-xl border border-ui-border/60">
        <CodeBlock highlightedCode={decoratorsHtml} />
      </div>
      <p className="mt-auto text-sm leading-relaxed text-ui-muted">
        This page compiles them with the standard decorators transform; the same code runs unchanged once browsers ship
        them.
      </p>
    </article>
  );
}
