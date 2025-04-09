import type { ComponentProps, JSX } from "react";

import { cn } from "@codefast/ui";

export function InputDateDemo({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div className={cn("", className)} {...props}>
      Coming soon
    </div>
  );
}
