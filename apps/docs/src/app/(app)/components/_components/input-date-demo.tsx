import { cn } from "@codefast/ui";
import type { ComponentProps, JSX } from "react";

export function InputDateDemo({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div className={cn("", className)} {...props}>
      Coming soon
    </div>
  );
}
