import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

type BrandWordmarkProps = Omit<ComponentProps<"span">, "children">;

/** The wordmark: one lowercase word, `labs` in the brand colour. */
export function BrandWordmark({ className, ...props }: BrandWordmarkProps) {
  return (
    <span className={cn("font-semibold tracking-tight", className)} {...props}>
      codefast<span className="text-ui-brand">labs</span>
    </span>
  );
}
