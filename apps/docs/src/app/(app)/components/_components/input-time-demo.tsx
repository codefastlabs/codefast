import { cn } from "@codefast/ui";
import type { ComponentProps, JSX } from "react";

export function InputTimeDemo({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div className={cn("", className)} {...props}>
      Coming soon
    </div>
  );
}
