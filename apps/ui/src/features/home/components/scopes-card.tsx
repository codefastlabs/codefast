import { Button } from "@codefast/ui/button";
import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";
import { useState } from "react";

import { createCaptiveContainer, validationMessage } from "#/features/home/demos/captive";
import { track } from "#/features/tracking/lib/tracking";

type ScopesCardProps = Omit<ComponentProps<"article">, "children">;

/** Scopes with validation: a singleton over a scoped binding, caught by validate() before the first resolve. */
export function ScopesCard({ className, ...props }: ScopesCardProps) {
  const [fixed, setFixed] = useState(false);
  const message = validationMessage(createCaptiveContainer(fixed));

  return (
    <article
      className={cn("flex flex-col gap-5 rounded-2xl border border-ui-border/60 bg-ui-card p-6 sm:p-8", className)}
      {...props}
    >
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-sm text-ui-brand tabular-nums">03</span>
        <h3 className="text-base font-semibold text-ui-fg">Scopes with validation</h3>
      </div>
      <p className="text-sm leading-relaxed text-ui-muted">
        Singleton, scoped or transient per binding. A singleton that holds a scoped instance would freeze the first
        request&rsquo;s session for the container&rsquo;s whole life; validate() refuses it up front.
      </p>
      <pre className="overflow-x-auto rounded-xl bg-ui-surface p-4 font-mono text-xs leading-relaxed text-ui-fg">
        {`container.bind(RequestSessionToken).to(RequestSession).scoped();\ncontainer.bind(ResponseCacheToken).to(ResponseCache).${fixed ? "scoped" : "singleton"}();\ncontainer.validate();`}
      </pre>
      <pre
        className={
          message === null
            ? "overflow-x-auto rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 font-mono text-xs leading-relaxed text-sky-700 dark:text-sky-400"
            : "overflow-x-auto rounded-xl border border-red-500/30 bg-red-500/5 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-red-700 dark:text-red-400"
        }
      >
        {message ?? "validate() passed: no captive dependency, no unreachable constraint."}
      </pre>
      <div className="mt-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            track("run_demo", { demo: "scopes", action: "toggle-scope", trigger: "click" });
            setFixed((value) => !value);
          }}
        >
          {fixed ? "Make the cache a singleton again" : "Make the cache scoped too"}
        </Button>
      </div>
    </article>
  );
}
