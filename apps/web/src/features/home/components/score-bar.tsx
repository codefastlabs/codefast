import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

interface ScoreBarProps extends Omit<ComponentProps<"div">, "children"> {
  readonly wins: number;
  readonly parities: number;
  readonly losses: number;
}

/** Won, tied and lost rows as one bar, each share sized by its count; the numbers themselves sit beside it. */
export function ScoreBar({ wins, parities, losses, className, ...props }: ScoreBarProps) {
  const total = wins + parities + losses;
  const segments = [
    { count: wins, tone: "bg-ui-brand" },
    { count: parities, tone: "bg-ui-muted/50" },
    { count: losses, tone: "bg-amber-500" },
  ];

  return (
    <div aria-hidden className={cn("flex h-2 w-full gap-px overflow-hidden rounded-full", className)} {...props}>
      {segments
        .filter((segment) => segment.count > 0)
        .map((segment) => (
          <span
            key={segment.tone}
            className={cn("h-full", segment.tone)}
            style={{ flexGrow: total === 0 ? 1 : segment.count / total, flexBasis: 0 }}
          />
        ))}
    </div>
  );
}
