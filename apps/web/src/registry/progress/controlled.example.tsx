import { Progress } from "@codefast/ui/progress";
import { Slider } from "@codefast/ui/slider";
import { useState } from "react";

export function ProgressControlled() {
  const [value, setValue] = useState([50]);

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <Progress value={value[0]} />
      <Slider value={value} onValueChange={setValue} min={0} max={100} step={1} />
    </div>
  );
}
