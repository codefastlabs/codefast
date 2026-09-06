import { Button } from "@codefast/ui/button";
import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";
import { useState } from "react";

import { CodeBlock } from "#/components/shared/code-block";
import { DemoVerdict } from "#/features/home/components/demo-verdict";
import { track } from "#/features/tracking/lib/tracking";

interface TypedTokensCardProps extends Omit<ComponentProps<"article">, "children"> {
  /** The class whose dependency list matches its constructor, as dual-theme highlighted HTML. */
  readonly rightListHtml: string;
  /** The same class naming the wrong token, as dual-theme highlighted HTML. */
  readonly wrongListHtml: string;
}

// The cause `tsc` reports for the wrong list, without the decorator-signature wrapper around it.
const COMPILER_CAUSE = "Property 'info' is missing in type 'Clock' but required in type 'Logger'.";

/** Typed tokens: the dependency list is checked against the constructor, and naming the wrong token fails to compile. */
export function TypedTokensCard({ rightListHtml, wrongListHtml, className, ...props }: TypedTokensCardProps) {
  const [wrong, setWrong] = useState(false);

  return (
    <article
      className={cn("flex flex-col gap-5 rounded-2xl border border-ui-border/60 bg-ui-card p-6 sm:p-8", className)}
      {...props}
    >
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-sm text-ui-brand tabular-nums">01</span>
        <h3 className="text-base font-semibold text-ui-fg">Typed tokens</h3>
      </div>
      <p className="text-sm leading-relaxed text-ui-muted">
        A Token&lt;Value&gt; flows through every bind → resolve path, and @injectable checks the dependency list against
        the constructor. Swap in the wrong token and the compiler says so before anything runs:
      </p>
      <div className="overflow-hidden rounded-xl border border-ui-border/60">
        <CodeBlock highlightedCode={wrong ? wrongListHtml : rightListHtml} />
      </div>
      <DemoVerdict tone={wrong ? "caught" : "pass"}>
        {wrong
          ? `tsc --noEmit: 1 error. ${COMPILER_CAUSE}`
          : "tsc --noEmit: 0 errors. The list names a Logger and the constructor takes one."}
      </DemoVerdict>
      <div className="mt-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            track("run_demo", { demo: "typed-tokens", action: "toggle-token", trigger: "click" });
            setWrong((value) => !value);
          }}
        >
          {wrong ? "Name the right token again" : "Name the wrong token"}
        </Button>
      </div>
    </article>
  );
}
