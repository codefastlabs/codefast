import { useAnimatedValue } from "@codefast/ui/hooks/use-animated-value";
import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps, ReactElement } from "react";

interface AnimatedStatProps extends Omit<ComponentProps<"div">, "children"> {
  label: string;
  value: number;
  suffix?: string | undefined;
  animate?: boolean | undefined;
}

/**
 * Large numeric readout that eases toward `value` via `useAnimatedValue`.
 *
 * `animate` is passed through so callers can honor reduced-motion preferences.
 */
export function AnimatedStat({
  label,
  value,
  suffix = "",
  animate = true,
  className,
  ...props
}: AnimatedStatProps): ReactElement {
  const displayed = useAnimatedValue(value, 800, animate);

  return (
    <div className={cn("space-y-1", className)} {...props}>
      <div className="text-4xl font-bold tracking-tight tabular-nums">
        {displayed}
        {suffix}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
