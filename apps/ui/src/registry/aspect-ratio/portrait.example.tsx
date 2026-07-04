import { AspectRatio } from "@codefast/ui/aspect-ratio";

export function AspectRatioPortrait() {
  return (
    <div className="w-full max-w-40">
      <AspectRatio ratio={9 / 16} className="overflow-hidden rounded-lg">
        <div aria-label="Photo" className="size-full bg-ui-surface" role="img" />
      </AspectRatio>
    </div>
  );
}
