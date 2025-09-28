import type { ComponentProps, JSX } from "react";

import { useId } from "react";

import { cn } from "@codefast/tailwind-variants";
import { Label, Radio } from "@codefast/ui";

export function RadioDemo({ className, ...props }: ComponentProps<"div">): JSX.Element {
  const id = useId();

  return (
    <div className={cn("grid gap-2", className)} {...props}>
      <div className="flex items-center gap-3">
        <Radio id={`${id}-1`} name="example" value="1" />
        <Label htmlFor={`${id}-1`}>Default</Label>
      </div>
      <div className="flex items-center gap-3">
        <Radio id={`${id}-2`} name="example" value="2" />
        <Label htmlFor={`${id}-2`}>Comfortable</Label>
      </div>
      <div className="flex items-center gap-3">
        <Radio id={`${id}-3`} name="example" value="3" />
        <Label htmlFor={`${id}-3`}>Compact</Label>
      </div>
      <div className="flex items-center gap-3">
        <Radio disabled id={`${id}-4`} name="example" value="4" />
        <Label htmlFor={`${id}-4`}>Disabled</Label>
      </div>
    </div>
  );
}
