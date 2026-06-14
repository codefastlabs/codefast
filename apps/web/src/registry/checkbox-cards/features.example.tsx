import { CheckboxCards, CheckboxCardsItem } from "@codefast/ui/checkbox-cards";
import { useState } from "react";

const FEATURES = [
  { value: "analytics", label: "Analytics", description: "Track usage and insights" },
  { value: "notifications", label: "Notifications", description: "Email and push alerts" },
  { value: "api", label: "API access", description: "Integrate with external tools" },
];

export function CheckboxCardsFeatures() {
  const [selected, setSelected] = useState<Array<string>>(["analytics"]);

  return (
    <div className="w-full max-w-xs space-y-3">
      <CheckboxCards className="grid gap-2" value={selected} onValueChange={(value) => setSelected(value ?? [])}>
        {FEATURES.map(({ value, label, description }) => (
          <CheckboxCardsItem key={value} value={value}>
            <div className="flex flex-col gap-0.5 text-start">
              <span className="text-sm font-medium">{label}</span>
              <span className="text-xs text-ui-muted">{description}</span>
            </div>
          </CheckboxCardsItem>
        ))}
      </CheckboxCards>
      <p className="text-center text-xs text-ui-muted">
        Enabled: <span className="font-medium text-ui-fg">{selected.join(", ") || "none"}</span>
      </p>
    </div>
  );
}
