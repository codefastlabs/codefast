import { CheckboxGroup, CheckboxGroupItem } from "@codefast/ui/checkbox-group";
import { Label } from "@codefast/ui/label";
import { useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export function CheckboxGroupHorizontal() {
  const [days, setDays] = useState<Array<string>>(["Mon", "Wed", "Fri"]);

  return (
    <div className="space-y-3">
      <CheckboxGroup className="flex flex-wrap gap-4" value={days} onValueChange={(value) => setDays(value ?? [])}>
        {DAYS.map((day) => (
          <div key={day} className="flex items-center gap-2">
            <CheckboxGroupItem id={`day-${day}`} value={day} />
            <Label htmlFor={`day-${day}`}>{day}</Label>
          </div>
        ))}
      </CheckboxGroup>
      <p className="text-xs text-ui-muted">
        Working days: <span className="font-medium text-ui-fg">{days.join(", ") || "none"}</span>
      </p>
    </div>
  );
}
