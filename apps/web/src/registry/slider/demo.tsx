import { Slider } from "@codefast/ui/slider";
import { Volume2Icon } from "lucide-react";
import { useState } from "react";

export function SliderDemo() {
  const [volume, setVolume] = useState([60]);
  const [range, setRange] = useState([200, 800]);

  return (
    <div className="w-full max-w-xs space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-ui-fg">
            <Volume2Icon className="size-4 text-ui-muted" />
            Volume
          </span>
          <span className="font-medium text-ui-fg">{volume[0]}%</span>
        </div>
        <Slider value={volume} onValueChange={setVolume} max={100} step={1} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ui-fg">Price range</span>
          <span className="font-medium text-ui-fg">
            ${range[0]} – ${range[1]}
          </span>
        </div>
        <Slider value={range} onValueChange={setRange} min={0} max={1000} step={10} />
      </div>
    </div>
  );
}
