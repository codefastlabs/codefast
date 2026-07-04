import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

/**
 * Small "New" pill flagging recently added components. Driven by
 * `ComponentMeta.isNew`, which auto-expires when `NEW_SINCE` is bumped.
 */
export function NewBadge({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full bg-ui-brand/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-ui-brand uppercase",
        className,
      )}
      {...props}
    >
      New
    </span>
  );
}
