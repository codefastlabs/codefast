import { CheckboxCards, CheckboxCardsItem } from "@codefast/ui/checkbox-cards";
import { useState } from "react";

const FEATURES = [
  { value: "analytics", label: "Analytics", description: "Track usage and insights" },
  { value: "notifications", label: "Notifications", description: "Email and push alerts" },
  { value: "api", label: "API Access", description: "Integrate with external tools" },
];

export function CheckboxCardsDemo() {
  const [selected, setSelected] = useState<Array<string>>(["analytics"]);

  return (
    <CheckboxCards
      className="grid w-full max-w-xs gap-2"
      value={selected}
      onValueChange={(v) => {
        setSelected(v ?? []);
      }}
    >
      {FEATURES.map(({ value, label, description }) => (
        <CheckboxCardsItem key={value} value={value}>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{label}</span>
            <span className="text-xs text-ui-muted">{description}</span>
          </div>
        </CheckboxCardsItem>
      ))}
    </CheckboxCards>
  );
}
