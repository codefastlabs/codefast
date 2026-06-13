import { AspectRatio } from "@codefast/ui/aspect-ratio";
import { Image } from "@unpic/react";

export function AspectRatioPortrait() {
  return (
    <div className="w-full max-w-40">
      <AspectRatio ratio={9 / 16} className="rounded-lg bg-muted">
        <Image
          src="https://avatar.vercel.sh/codefast"
          alt="Photo"
          width={360}
          height={640}
          className="size-full rounded-lg object-cover grayscale dark:brightness-20"
        />
      </AspectRatio>
    </div>
  );
}
