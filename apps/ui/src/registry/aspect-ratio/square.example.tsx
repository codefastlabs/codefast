import { AspectRatio } from "@codefast/ui/aspect-ratio";

export function AspectRatioSquare() {
  return (
    <div className="w-full max-w-48">
      <AspectRatio ratio={1 / 1} className="overflow-hidden rounded-lg">
        <div aria-label="Photo" className="size-full bg-ui-surface" role="img" />
      </AspectRatio>
    </div>
  );
}
