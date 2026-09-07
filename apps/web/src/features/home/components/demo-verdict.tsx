import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

interface DemoVerdictProps extends ComponentProps<"p"> {
  /** `pass` when the tool accepted the sample, `caught` when it refused a mistake by design. */
  readonly tone: "pass" | "caught";
}

/**
 * A demo's one-line outcome under its code. Sky says the tool accepted the sample and amber says it caught a mistake
 * on purpose; red is kept for something actually breaking, which a verdict never is.
 */
export function DemoVerdict({ tone, className, ...props }: DemoVerdictProps) {
  return (
    <p
      role="status"
      className={cn(
        "rounded-xl border p-4 font-mono text-xs leading-relaxed",
        tone === "pass" && "border-sky-500/30 bg-sky-500/5 text-sky-700 dark:text-sky-400",
        tone === "caught" && "border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-300",
        className,
      )}
      {...props}
    />
  );
}
