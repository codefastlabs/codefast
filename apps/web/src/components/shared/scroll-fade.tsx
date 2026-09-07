import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

type ScrollFadeProps = ComponentProps<"div">;

/**
 * Frames one horizontally scrolling child and fades its trailing edge while content remains past it. The fade takes
 * its colour from `--scroll-fade-color`, so a caller whose scroller sits on another surface sets that variable.
 */
export function ScrollFade({ className, ...props }: ScrollFadeProps) {
  return <div className={cn("scroll-fade-x", className)} {...props} />;
}
