import { useState } from "react";
import { Label } from "@codefast/ui/label";
import { RadioGroup, RadioGroupItem } from "@codefast/ui/radio-group";

const SIZES = ["S", "M", "L", "XL"];

export function RadioGroupHorizontal() {
  const [size, setSize] = useState("M");

  return (
    <div className="space-y-3 text-center">
      <RadioGroup
        className="flex flex-wrap justify-center gap-4"
        value={size}
        onValueChange={(value) => setSize(value)}
      >
        {SIZES.map((value) => (
          <div key={value} className="flex items-center gap-2">
            <RadioGroupItem id={`size-${value}`} value={value} />
            <Label htmlFor={`size-${value}`}>{value}</Label>
          </div>
        ))}
      </RadioGroup>
      <p className="text-xs text-ui-muted">
        Size: <span className="font-medium text-ui-fg">{size}</span>
      </p>
    </div>
  );
}
