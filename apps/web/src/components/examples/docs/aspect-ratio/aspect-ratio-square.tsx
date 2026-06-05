import { AspectRatio } from "@codefast/ui/aspect-ratio";

export function AspectRatioSquare() {
  return (
    <div className="w-full max-w-[12rem]">
      <AspectRatio ratio={1 / 1} className="rounded-lg bg-muted">
        <img
          src="https://avatar.vercel.sh/shadcn1"
          alt="Landscape"
          className="size-full rounded-lg object-cover grayscale dark:brightness-[0.2]"
        />
      </AspectRatio>
    </div>
  );
}
