import { AspectRatio } from "@codefast/ui/aspect-ratio";

export function AspectRatioDemo() {
  return (
    <div className="w-full max-w-sm">
      <AspectRatio ratio={16 / 9} className="rounded-lg bg-muted">
        <img
          src="https://avatar.vercel.sh/shadcn1"
          alt="Landscape"
          className="size-full rounded-lg object-cover grayscale dark:brightness-[0.2]"
        />
      </AspectRatio>
    </div>
  );
}
