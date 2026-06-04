import { AspectRatio } from "@codefast/ui/aspect-ratio";
import { PlayIcon } from "lucide-react";

export function AspectRatioMedia() {
  return (
    <div className="w-full max-w-xs overflow-hidden rounded-xl border border-ui-border">
      <AspectRatio ratio={16 / 9}>
        <div className="relative flex h-full w-full items-center justify-center bg-ui-surface">
          <span className="flex size-12 items-center justify-center rounded-full bg-ui-brand text-white shadow-lg">
            <PlayIcon className="size-5 translate-x-0.5 fill-current" />
          </span>
          <span className="absolute right-2 bottom-2 rounded bg-ui-bg/70 px-1.5 py-0.5 text-[10px] font-medium text-ui-fg tabular-nums">
            12:48
          </span>
        </div>
      </AspectRatio>
    </div>
  );
}
