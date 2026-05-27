import { useState } from "react";
import { Slider } from "@codefast/ui/slider";

export function SliderDemo() {
  const [value, setValue] = useState([60]);

  return (
    <div className="w-full max-w-xs space-y-3">
      <Slider value={value} onValueChange={setValue} max={100} step={1} />
      <p className="text-center text-xs text-(--sea-ink-soft)">Value: {value[0]}</p>
    </div>
  );
}
