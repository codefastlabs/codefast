import { Label } from "@codefast/ui/label";
import { RadioGroup, RadioGroupItem } from "@codefast/ui/radio-group";
import { useState } from "react";

const DENSITY_OPTIONS = ["compact", "comfortable", "spacious"] as const;
type Density = (typeof DENSITY_OPTIONS)[number];

const DENSITY_SET = new Set<string>(DENSITY_OPTIONS);
const isDensity = (v: string): v is Density => DENSITY_SET.has(v);

export function RadioGroupDemo() {
  const [radio, setRadio] = useState<Density>("comfortable");

  return (
    <RadioGroup
      value={radio}
      onValueChange={(v) => {
        if (isDensity(v)) {
          setRadio(v);
        }
      }}
      className="gap-3"
    >
      {DENSITY_OPTIONS.map((v) => (
        <div key={v} className="flex items-center gap-2">
          <RadioGroupItem value={v} id={`radio-${v}`} />
          <Label htmlFor={`radio-${v}`} className="capitalize">
            {v}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
