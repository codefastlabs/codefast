import { Button } from "@codefast/ui/button";
import { useCopyToClipboard } from "@codefast/ui/hooks/use-copy-to-clipboard";
import { cn, tv } from "@codefast/ui/lib/utils";
import type { VariantProps } from "@codefast/ui/lib/utils";
import { CheckIcon, CopyIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { track } from "#/features/tracking/lib/tracking";

/** `copy_code`'s `kind` values — what's being copied, never the copied text itself. */
export type CopyAnalyticsKind = "install-command" | "setup-snippet" | "usage-example";

/**
 * Surface treatments for the copy chip. Colours come from the app's `ui-*`
 * palette (not the shared `@codefast/ui` tokens), so we layer them over a
 * `ghost` Button: the variant supplies structure, focus ring, and the icon
 * sizing; these classes own the look.
 */
const copyButtonVariants = tv({
  base: "rounded-lg text-xs font-medium",
  defaultVariants: {
    tone: "inline",
  },
  variants: {
    tone: {
      /** Inline on a light surface (copy fields, install CTA). */
      inline: "border-ui-border/60 text-ui-muted hover:bg-ui-fg/6 hover:text-ui-fg",
      /** Floating over a code surface — frosted card that reads on light or dark. */
      overlay:
        "border-ui-border/60 bg-ui-card/90 text-ui-muted shadow-sm backdrop-blur-sm hover:bg-ui-surface hover:text-ui-fg dark:border-white/10 dark:bg-white/10 dark:text-white/70 dark:shadow-none dark:hover:bg-white/20 dark:hover:text-white",
      /** On an always-dark surface (Shiki snippet on neutral-900). */
      dark: "border-white/10 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white",
    },
  },
});

type CopyButtonVariants = VariantProps<typeof copyButtonVariants>;

interface CopyButtonProps extends Omit<ComponentProps<typeof Button>, "children" | "value">, CopyButtonVariants {
  /** Raw text written to the clipboard. */
  readonly value: string;
  /** Idle text shown next to the icon. */
  readonly idleLabel?: string;
  /** Text shown during the transient "copied" state. */
  readonly copiedLabel?: string;
  /** When set together with `analyticsName`, tracks `copy_code` on a successful copy. */
  readonly analyticsKind?: CopyAnalyticsKind | undefined;
  /** Identifier for what was copied (e.g. a component slug) — never the copied text. */
  readonly analyticsName?: string | undefined;
}

/**
 * Copy chip for code surfaces and inline values. Owns the transient "Copied"
 * feedback from `useCopyToClipboard`; the caller picks a `tone` for the surface
 * and forwards `className` for positioning (e.g. an `absolute` overlay button).
 */
export function CopyButton({
  value,
  tone,
  idleLabel = "Copy",
  copiedLabel = "Copied",
  analyticsKind,
  analyticsName,
  "aria-label": ariaLabel,
  variant = "ghost",
  size = "sm",
  className,
  ...props
}: CopyButtonProps) {
  const { copyToClipboard, isCopied } = useCopyToClipboard({
    onCopy: () => {
      if (analyticsKind !== undefined && analyticsName !== undefined) {
        track("copy_code", { kind: analyticsKind, name: analyticsName });
      }
    },
  });

  return (
    <Button
      variant={variant}
      size={size}
      // While idle, defer to a caller-supplied descriptive label; the copied
      // state always announces itself.
      aria-label={isCopied ? copiedLabel : (ariaLabel ?? idleLabel)}
      // `onClick` sits after `{...props}` so callers can't override the copy handler.
      {...props}
      onClick={() => void copyToClipboard(value)}
      className={cn(copyButtonVariants(tone === undefined ? undefined : { tone }), className)}
    >
      {isCopied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
      {isCopied ? copiedLabel : idleLabel}
    </Button>
  );
}
