import type { ComponentProps, JSX } from "react";

import { cn } from "@codefast/tailwind-variants";
import { Kbd } from "@codefast/ui";

export function KbdDemo({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div className={cn("", className)} {...props}>
      <p>
        Please press <Kbd>Ctrl</Kbd> + <Kbd>Shift</Kbd> + <Kbd>R</Kbd> to re-render an this page.
      </p>
    </div>
  );
}
