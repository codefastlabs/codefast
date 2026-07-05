import { AspectRatio } from "@codefast/ui/aspect-ratio";
import { Image } from "@unpic/react";

export function AspectRatioPortrait() {
  return (
    <div className="w-full max-w-40">
      <AspectRatio ratio={9 / 16} className="overflow-hidden rounded-lg">
        <Image
          alt="Photo"
          className="size-full object-cover grayscale"
          height={640}
          layout="constrained"
          src="https://images.unsplash.com/photo-1494337480532-3725c85fd2ab?auto=format&fit=crop&w=640&q=80"
          width={360}
        />
      </AspectRatio>
    </div>
  );
}
