import { useState } from "react";
import { Slider } from "@codefast/ui/slider";
import { Volume2Icon, VolumeXIcon } from "lucide-react";

export function SliderVolume() {
  const [value, setValue] = useState([60]);
  const volume = value[0] ?? 0;

  return (
    <div className="flex w-full max-w-xs items-center gap-3">
      {volume === 0 ? (
        <VolumeXIcon className="size-4 shrink-0 text-ui-muted" />
      ) : (
        <Volume2Icon className="size-4 shrink-0 text-ui-muted" />
      )}
      <Slider value={value} onValueChange={setValue} max={100} step={1} aria-label="Volume" />
      <span className="w-9 text-right text-xs text-ui-muted tabular-nums">{volume}%</span>
    </div>
  );
}
