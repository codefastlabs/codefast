import { Label } from "@codefast/ui/label";
import { Radio } from "@codefast/ui/radio";
import { useState } from "react";

const SIZES = ["Small", "Medium", "Large"] as const;
type Size = (typeof SIZES)[number];

export function RadioDemo() {
  const [selected, setSelected] = useState<Size>("Medium");

  return (
    <div className="flex flex-col gap-3">
      {SIZES.map((size) => (
        <div key={size} className="flex items-center gap-2">
          <Radio
            checked={selected === size}
            id={`radio-size-${size}`}
            name="size"
            value={size}
            onValueChange={(v) => {
              setSelected(v as Size);
            }}
          />
          <Label htmlFor={`radio-size-${size}`}>{size}</Label>
        </div>
      ))}
    </div>
  );
}
