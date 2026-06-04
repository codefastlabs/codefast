import { AspectRatio } from "@codefast/ui/aspect-ratio";

export function AspectRatioBanner() {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border border-ui-border">
      <AspectRatio ratio={21 / 9}>
        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-ui-brand/25 via-ui-surface to-ui-surface">
          <p className="text-sm font-semibold text-ui-fg">Ultra-wide banner</p>
          <p className="text-xs text-ui-muted">21 / 9 — perfect for hero headers</p>
        </div>
      </AspectRatio>
    </div>
  );
}
