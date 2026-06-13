import { CheckboxCards, CheckboxCardsItem } from "@codefast/ui/checkbox-cards";
import { useState } from "react";

const PLANS = [
  { value: "free", label: "Free", description: "Up to 3 projects", disabled: false },
  { value: "pro", label: "Pro", description: "Unlimited projects", disabled: false },
  { value: "enterprise", label: "Enterprise", description: "Contact sales", disabled: true },
];

export function CheckboxCardsDisabled() {
  const [selected, setSelected] = useState<Array<string>>(["pro"]);

  return (
    <CheckboxCards
      className="grid w-full max-w-xs gap-2"
      value={selected}
      onValueChange={(value) => setSelected(value ?? [])}
    >
      {PLANS.map(({ value, label, description, disabled }) => (
        <CheckboxCardsItem key={value} value={value} {...(disabled ? { disabled } : {})}>
          <div className="flex flex-col gap-0.5 text-start">
            <span className="text-sm font-medium">{label}</span>
            <span className="text-xs text-ui-muted">{description}</span>
          </div>
        </CheckboxCardsItem>
      ))}
    </CheckboxCards>
  );
}
