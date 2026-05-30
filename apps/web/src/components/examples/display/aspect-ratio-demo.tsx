import { cn } from "@codefast/tailwind-variants";
import { AspectRatio } from "@codefast/ui/aspect-ratio";

export function AspectRatioDemo() {
  return (
    <div className={cn("w-full max-w-sm overflow-hidden", "rounded-xl border")}>
      <AspectRatio ratio={16 / 9}>
        <div
          className={cn(
            "flex h-full w-full items-center justify-center",
            "bg-muted text-sm text-muted-foreground",
          )}
        >
          16 / 9
        </div>
      </AspectRatio>
    </div>
  );
}
