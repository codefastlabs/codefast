import { CheckboxCards, CheckboxCardsItem } from "@codefast/ui/checkbox-cards";
import { useState } from "react";

const ADDONS = [
  { value: "ci", label: "CI minutes" },
  { value: "seats", label: "Extra seats" },
  { value: "storage", label: "More storage" },
  { value: "support", label: "Priority support" },
];

export function CheckboxCardsColumns() {
  const [selected, setSelected] = useState<Array<string>>(["ci", "storage"]);

  return (
    <CheckboxCards
      className="grid w-full max-w-sm grid-cols-2 gap-2"
      value={selected}
      onValueChange={(value) => setSelected(value ?? [])}
    >
      {ADDONS.map(({ value, label }) => (
        <CheckboxCardsItem key={value} value={value}>
          <span className="text-sm font-medium">{label}</span>
        </CheckboxCardsItem>
      ))}
    </CheckboxCards>
  );
}
