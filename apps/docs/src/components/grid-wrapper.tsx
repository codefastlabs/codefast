import { cn } from "@codefast/ui";
import type { ComponentProps, JSX } from "react";

export function GridWrapper({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div className="@container mx-auto w-full overflow-hidden" {...props}>
      <div
        className={cn(
          "@3xl:grid-cols-2 @5xl:grid-cols-3 -m-px grid grid-flow-dense divide-y *:overflow-auto *:px-1 *:py-8 *:last:border-r *:sm:px-8 md:divide-x",
          className,
        )}
        {...props}
      />
    </div>
  );
}
