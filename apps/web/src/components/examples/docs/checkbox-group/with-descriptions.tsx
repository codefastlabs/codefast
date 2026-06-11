import { CheckboxGroup, CheckboxGroupItem } from "@codefast/ui/checkbox-group";
import { Label } from "@codefast/ui/label";
import { useState } from "react";

const NOTIFICATIONS = [
  { value: "comments", label: "Comments", hint: "When someone replies to your thread." },
  { value: "mentions", label: "Mentions", hint: "When you’re @-mentioned anywhere." },
  { value: "digest", label: "Weekly digest", hint: "A Monday summary of activity." },
];

export function CheckboxGroupWithDescriptions() {
  const [value, setValue] = useState<Array<string>>(["mentions"]);

  return (
    <CheckboxGroup className="w-full max-w-xs gap-4" value={value} onValueChange={(next) => setValue(next ?? [])}>
      {NOTIFICATIONS.map((item) => (
        <div key={item.value} className="flex items-start gap-3">
          <CheckboxGroupItem id={`notify-${item.value}`} value={item.value} className="mt-0.5" />
          <div className="grid gap-0.5">
            <Label htmlFor={`notify-${item.value}`}>{item.label}</Label>
            <p className="text-xs text-ui-muted">{item.hint}</p>
          </div>
        </div>
      ))}
    </CheckboxGroup>
  );
}
