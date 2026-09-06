import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";
import { useEffect, useRef } from "react";

/** One line of the playground's log; `warn` is a refusal the demo recovers from, `error` something it could not. */
export interface LogEntry {
  readonly id: number;
  readonly tone: "info" | "success" | "warn" | "error";
  readonly text: string;
}

interface ResolutionLogProps extends Omit<ComponentProps<"div">, "children"> {
  readonly entries: ReadonlyArray<LogEntry>;
}

/** The playground's console: what the container did, newest line kept in view. */
export function ResolutionLog({ entries, className, ...props }: ResolutionLogProps) {
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = scroller.current;

    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [entries]);

  return (
    <div
      ref={scroller}
      aria-live="polite"
      className={cn(
        "h-72 overflow-y-auto rounded-xl border border-ui-border/60 bg-neutral-950 p-5 font-mono text-xs leading-relaxed text-neutral-100",
        className,
      )}
      {...props}
    >
      {entries.length === 0 ? (
        <p className="text-neutral-500">Resolve OrderService, or open a request scope first.</p>
      ) : (
        <ol className="flex flex-col gap-0.5">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className={cn(
                entry.tone === "error" && "text-red-400",
                entry.tone === "warn" && "text-amber-300",
                entry.tone === "success" && "text-sky-400",
                entry.tone === "info" && "text-neutral-200",
              )}
            >
              {entry.text}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
