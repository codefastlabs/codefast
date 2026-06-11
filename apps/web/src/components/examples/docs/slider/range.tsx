import { Slider } from "@codefast/ui/slider";
import { useState } from "react";

export function SliderRange() {
  const [range, setRange] = useState([200, 700]);

  return (
    <div className="w-full max-w-xs space-y-3">
      <Slider
        value={range}
        onValueChange={setRange}
        min={0}
        max={1000}
        step={10}
        aria-label="Price range"
      />
      <p className="text-center text-xs text-ui-muted tabular-nums">
        ${range[0]} – ${range[1]}
      </p>
    </div>
  );
}
