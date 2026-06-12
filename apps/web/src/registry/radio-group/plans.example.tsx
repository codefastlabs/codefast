import { Label } from "@codefast/ui/label";
import { RadioGroup, RadioGroupItem } from "@codefast/ui/radio-group";
import { useState } from "react";

const PLANS = [
  { value: "starter", label: "Starter", hint: "$0 — for side projects." },
  { value: "pro", label: "Pro", hint: "$12 — for growing teams." },
  { value: "scale", label: "Scale", hint: "$49 — for high traffic." },
];

export function RadioGroupPlans() {
  const [plan, setPlan] = useState("pro");

  return (
    <RadioGroup className="w-full max-w-xs gap-3" value={plan} onValueChange={(value) => setPlan(value)}>
      {PLANS.map((item) => (
        <Label
          key={item.value}
          htmlFor={`plan-${item.value}`}
          className="flex items-start gap-3 rounded-xl border border-ui-border p-3 has-[:checked]:border-ui-brand"
        >
          <RadioGroupItem id={`plan-${item.value}`} value={item.value} className="mt-0.5" />
          <div className="grid gap-0.5">
            <span className="text-sm font-medium text-ui-fg">{item.label}</span>
            <span className="text-xs text-ui-muted">{item.hint}</span>
          </div>
        </Label>
      ))}
    </RadioGroup>
  );
}
