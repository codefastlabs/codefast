import { AspectRatio } from "@codefast/ui/aspect-ratio";
import { Image } from "@unpic/react";

export function AspectRatioSquare() {
  return (
    <div className="w-full max-w-48">
      <AspectRatio ratio={1 / 1} className="overflow-hidden rounded-lg">
        <Image
          alt="Photo"
          className="size-full object-cover grayscale"
          height={480}
          layout="constrained"
          src="https://images.unsplash.com/photo-1494337480532-3725c85fd2ab?auto=format&fit=crop&w=640&q=80"
          width={480}
        />
      </AspectRatio>
    </div>
  );
}
