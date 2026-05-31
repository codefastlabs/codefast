import { AspectRatio } from "@codefast/ui/aspect-ratio";

export function AspectRatioDemo() {
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-xl border">
      <AspectRatio ratio={16 / 9}>
        <div className="flex h-full w-full items-center justify-center bg-ui-surface text-sm text-ui-muted">
          16 / 9
        </div>
      </AspectRatio>
    </div>
  );
}
