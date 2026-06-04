import { useState } from "react";
import { Slider } from "@codefast/ui/slider";

const MARKS = [0, 25, 50, 75, 100];

export function SliderStepped() {
  const [value, setValue] = useState([50]);

  return (
    <div className="w-full max-w-xs space-y-2">
      <Slider
        value={value}
        onValueChange={setValue}
        min={0}
        max={100}
        step={25}
        aria-label="Quality"
      />
      <div className="flex justify-between text-xs text-ui-muted tabular-nums">
        {MARKS.map((mark) => (
          <span key={mark} className={value[0] === mark ? "font-medium text-ui-fg" : ""}>
            {mark}
          </span>
        ))}
      </div>
    </div>
  );
}
