import { Label } from "@codefast/ui/label";
import { RadioGroup, RadioGroupItem } from "@codefast/ui/radio-group";
import { useState } from "react";

const OPTIONS = ["compact", "comfortable", "spacious"] as const;
type Density = (typeof OPTIONS)[number];

const SET = new Set<string>(OPTIONS);
const isDensity = (value: string): value is Density => SET.has(value);

export function RadioGroupDensity() {
  const [density, setDensity] = useState<Density>("comfortable");

  return (
    <div className="space-y-3">
      <RadioGroup
        className="gap-3"
        value={density}
        onValueChange={(value) => {
          if (isDensity(value)) {
            setDensity(value);
          }
        }}
      >
        {OPTIONS.map((value) => (
          <div key={value} className="flex items-center gap-2">
            <RadioGroupItem id={`density-${value}`} value={value} />
            <Label htmlFor={`density-${value}`} className="capitalize">
              {value}
            </Label>
          </div>
        ))}
      </RadioGroup>
      <p className="text-xs text-ui-muted">
        Density: <span className="font-medium text-ui-fg capitalize">{density}</span>
      </p>
    </div>
  );
}
