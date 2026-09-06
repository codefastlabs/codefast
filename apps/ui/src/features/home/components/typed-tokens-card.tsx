import type { ComponentProps } from "react";

import { CodeBlock } from "#/components/shared/code-block";

interface TypedTokensCardProps extends Omit<ComponentProps<"article">, "children"> {
  /** The mis-declared class as dual-theme highlighted HTML. */
  readonly wrongListHtml: string;
}

// What `tsc` reports for the sample above: the dependency list names a Clock where the constructor wants a Logger.
const COMPILER_OUTPUT = [
  "error TS1238: Unable to resolve signature of class decorator when called as an expression.",
  "  Argument of type 'typeof CheckoutService' is not assignable to parameter of type",
  "  'abstract new (args_0: Clock) => unknown'.",
  "    Types of parameters 'logger' and 'args_0' are incompatible.",
  "      Property 'info' is missing in type 'Clock' but required in type 'Logger'.",
];

/** Typed tokens: a wrong dependency list is a compile error, shown with the compiler's actual words. */
export function TypedTokensCard({ wrongListHtml, ...props }: TypedTokensCardProps) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-ui-border/60 bg-ui-card p-6" {...props}>
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-sm text-ui-brand tabular-nums">01</span>
        <h3 className="text-base font-semibold text-ui-fg">Typed tokens</h3>
      </div>
      <p className="text-sm leading-relaxed text-ui-muted">
        A Token&lt;Value&gt; flows through every bind → resolve path, and @injectable checks the dependency list against
        the constructor. Name the wrong token and the compiler says so:
      </p>
      <div className="overflow-hidden rounded-xl border border-ui-border/60">
        <CodeBlock highlightedCode={wrongListHtml} />
      </div>
      <pre className="overflow-x-auto rounded-xl border border-red-500/30 bg-red-500/5 p-4 font-mono text-xs leading-relaxed text-red-700 dark:text-red-400">
        {COMPILER_OUTPUT.join("\n")}
      </pre>
    </article>
  );
}
