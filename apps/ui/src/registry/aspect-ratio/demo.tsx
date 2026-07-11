import { AspectRatio } from "@codefast/ui/aspect-ratio";
import { Image } from "@unpic/react";

export function AspectRatioDemo() {
  return (
    <div className="w-full max-w-sm">
      <AspectRatio className="rounded-lg bg-muted" ratio={16 / 9}>
        <Image
          alt="Photo"
          className="size-full rounded-lg object-cover grayscale"
          layout="fullWidth"
          src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&q=80"
        />
      </AspectRatio>
    </div>
  );
}
