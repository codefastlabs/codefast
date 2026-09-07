import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

import type { BrandColor } from "#/features/brand/data";

// `color` shadows the deprecated HTML attribute of the same name, so that attribute is dropped from the base.
interface BrandSwatchProps extends Omit<ComponentProps<"div">, "children" | "color"> {
  readonly color: BrandColor;
}

/** One palette entry: the colour, its name and role, and the token it resolves from. */
export function BrandSwatch({ color, className, ...props }: BrandSwatchProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      {/* The colour is data, so it cannot be a Tailwind class. */}
      <div className="h-16 rounded-xl border border-ui-border/60" style={{ backgroundColor: color.hex }} />
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm">
        <span className="font-semibold text-ui-fg">{color.name}</span>
        <span className="text-ui-muted">{color.role}</span>
      </div>
      <p className="font-mono text-xs leading-relaxed text-ui-muted">
        {color.token} · {color.oklch} · {color.hex}
      </p>
    </div>
  );
}
