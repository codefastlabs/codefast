import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

interface BrandMarkProps extends Omit<ComponentProps<"svg">, "children" | "viewBox"> {
  /** `lit` lights the lead tile in the brand colour; `mono` draws every tile in `currentColor`, as the header does. */
  readonly tone?: "lit" | "mono" | undefined;
  /** Brightens the trail for renders at 32 px and under, so the fourth tile survives a browser tab. */
  readonly small?: boolean | undefined;
}

/** The Codefast Labs mark: four tiles for a family of packages, the lead one lit. */
export function BrandMark({ tone = "mono", small = false, className, ...props }: BrandMarkProps) {
  const [first, second, third] = small ? [0.5, 0.5, 0.25] : [0.4, 0.4, 0.15];

  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className={cn("shrink-0", className)} {...props}>
      <rect x="4" y="4" width="24" height="24" rx="6" className={tone === "lit" ? "fill-ui-brand" : "fill-current"} />
      <rect x="36" y="4" width="24" height="24" rx="6" className="fill-current" fillOpacity={first} />
      <rect x="4" y="36" width="24" height="24" rx="6" className="fill-current" fillOpacity={second} />
      <rect x="36" y="36" width="24" height="24" rx="6" className="fill-current" fillOpacity={third} />
    </svg>
  );
}
