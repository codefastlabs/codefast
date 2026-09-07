import { cn } from "@codefast/ui/lib/utils";

import { MarqueePills } from "#/features/home/components/marquee-pills";
import type { ComponentMeta } from "#/registry/_core/components";

interface MarqueeRowProps {
  readonly components: ReadonlyArray<ComponentMeta>;
  /** Scroll the row the opposite way, so adjacent rows counter-flow. */
  readonly reverse?: boolean;
  /** Merged onto the moving track — set the `--marquee-duration` property to vary the speed per row. */
  readonly className?: string | undefined;
}

/**
 * One endlessly scrolling row of component pills. The track holds two copies of
 * the pills so the -50% keyframe loops seamlessly; hovering pauses it, and
 * reduced-motion users get a static wrapped list instead.
 */
export function MarqueeRow({ components, reverse = false, className }: MarqueeRowProps) {
  return (
    <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] motion-reduce:[mask-image:none]">
      <div
        className={cn(
          "marquee-track flex w-max motion-reduce:w-full",
          reverse && "[--marquee-direction:reverse]",
          className,
        )}
      >
        <MarqueePills components={components} />
        <MarqueePills components={components} decorative />
      </div>
    </div>
  );
}
