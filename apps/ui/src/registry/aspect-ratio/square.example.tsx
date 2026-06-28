import { AspectRatio } from "@codefast/ui/aspect-ratio";
import { Image } from "@unpic/react";

export function AspectRatioSquare() {
  return (
    <div className="w-full max-w-48">
      <AspectRatio ratio={1 / 1} className="rounded-lg bg-muted">
        <Image
          src="https://avatar.vercel.sh/codefast"
          alt="Photo"
          width={480}
          height={480}
          className="size-full rounded-lg object-cover grayscale dark:brightness-20"
        />
      </AspectRatio>
    </div>
  );
}
