import { AspectRatio } from "@codefast/ui/aspect-ratio";

const RATIOS = [
  { label: "16 / 9", value: 16 / 9 },
  { label: "1 / 1", value: 1 },
  { label: "4 / 3", value: 4 / 3 },
];

export function AspectRatioRatios() {
  return (
    <div className="grid w-full max-w-md grid-cols-3 gap-3">
      {RATIOS.map((item) => (
        <div key={item.label} className="overflow-hidden rounded-xl border">
          <AspectRatio ratio={item.value}>
            <div className="flex h-full w-full items-center justify-center bg-ui-surface text-xs text-ui-muted">
              {item.label}
            </div>
          </AspectRatio>
        </div>
      ))}
    </div>
  );
}
