import { Button } from "@codefast/ui/button";
import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";
import { useState } from "react";

import { ScrollFade } from "#/components/shared/scroll-fade";
import { DemoVerdict } from "#/features/home/components/demo-verdict";
import { createCaptiveContainer, validationMessage } from "#/features/home/demos/captive";
import { track } from "#/features/tracking/lib/tracking";

type ScopesCardProps = Omit<ComponentProps<"article">, "children">;

/** Scopes with validation: a sound graph by default, and the captive singleton validate() refuses one click away. */
export function ScopesCard({ className, ...props }: ScopesCardProps) {
  const [fixed, setFixed] = useState(true);
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
        Singleton, scoped or transient per binding. A singleton that held a scoped instance would freeze the first
        request&rsquo;s session for the container&rsquo;s whole life, so validate() refuses that graph up front:
      </p>
      <ScrollFade className="rounded-xl bg-ui-surface [--scroll-fade-color:var(--ui-surface)]">
        <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-ui-fg">
          {`container.bind(RequestSessionToken).to(RequestSession).scoped();\ncontainer.bind(ResponseCacheToken).to(ResponseCache).${fixed ? "scoped" : "singleton"}();\ncontainer.validate();`}
        </pre>
      </ScrollFade>
      <DemoVerdict tone={message === null ? "pass" : "caught"}>
        {message === null
          ? "validate() passed: no captive dependency, no unreachable constraint."
          : `validate() refused: ${message}`}
      </DemoVerdict>
      <div className="mt-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            track("run_demo", { demo: "scopes", action: "toggle-scope", trigger: "click" });
            setFixed((value) => !value);
          }}
        >
          {fixed ? "Make the cache a singleton" : "Make the cache scoped again"}
        </Button>
      </div>
    </article>
  );
}
