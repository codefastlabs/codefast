import { Label } from "@codefast/ui/label";
import { Radio } from "@codefast/ui/radio";
import { useState } from "react";

const SIZES = ["Small", "Medium", "Large"];

export function RadioSizes() {
  const [selected, setSelected] = useState("Medium");

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3">
        {SIZES.map((size) => (
          <div key={size} className="flex items-center gap-2">
            <Radio
              id={`size-${size}`}
              name="size"
              value={size}
              checked={selected === size}
              onValueChange={(value) => setSelected(value)}
            />
            <Label htmlFor={`size-${size}`}>{size}</Label>
          </div>
        ))}
      </div>
      <p className="text-xs text-ui-muted">
        Size: <span className="font-medium text-ui-fg">{selected}</span>
      </p>
    </div>
  );
}
