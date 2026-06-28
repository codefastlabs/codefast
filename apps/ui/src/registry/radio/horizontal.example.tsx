import { Label } from "@codefast/ui/label";
import { Radio } from "@codefast/ui/radio";
import { useState } from "react";

const OPTIONS = ["Yes", "No", "Maybe"];

export function RadioHorizontal() {
  const [value, setValue] = useState("Yes");

  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {OPTIONS.map((option) => (
        <div key={option} className="flex items-center gap-2">
          <Radio
            id={`vote-${option}`}
            name="vote"
            value={option}
            checked={value === option}
            onValueChange={(next) => setValue(next)}
          />
          <Label htmlFor={`vote-${option}`}>{option}</Label>
        </div>
      ))}
    </div>
  );
}
