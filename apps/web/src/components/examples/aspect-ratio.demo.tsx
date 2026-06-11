import { AspectRatio } from "@codefast/ui/aspect-ratio";
import { PlayIcon } from "lucide-react";

export function AspectRatioDemo() {
  return (
    <div className="w-full max-w-sm">
      <div className="overflow-hidden rounded-xl border">
        <AspectRatio ratio={16 / 9}>
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ui-brand/80 to-violet-500">
            <span className="flex size-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <PlayIcon className="size-5 fill-white text-white" />
            </span>
          </div>
        </AspectRatio>
      </div>
      <p className="mt-2 text-xs text-ui-muted">Product walkthrough · 16:9</p>
    </div>
  );
}
