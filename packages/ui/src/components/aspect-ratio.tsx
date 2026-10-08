import * as AspectRatioPrimitive from "radix-ui/aspect-ratio";
import type { ComponentProps, JSX } from "react";

import { behaviorSlot } from "#lib/slot";

// ── Component: AspectRatio ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
type AspectRatioProps = ComponentProps<typeof AspectRatioPrimitive.Root>;

/**
 * @since 0.3.16-canary.0
 */
function AspectRatio({ ...props }: AspectRatioProps): JSX.Element {
  return <AspectRatioPrimitive.Root {...behaviorSlot("aspect-ratio", props.asChild)} {...props} />;
}

// ── Exports ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export { AspectRatio };
export type { AspectRatioProps };
