import { RadioCards, RadioCardsItem } from "@codefast/ui/radio-cards";
import { useState } from "react";

const PLANS = [
  { value: "free", label: "Free", price: "$0 / mo", description: "For personal projects" },
  { value: "pro", label: "Pro", price: "$12 / mo", description: "For professional use" },
  { value: "team", label: "Team", price: "$49 / mo", description: "For growing teams" },
];

export function RadioCardsDemo() {
  const [plan, setPlan] = useState("pro");

  return (
    <RadioCards className="grid w-full max-w-xs gap-2" value={plan} onValueChange={setPlan}>
      {PLANS.map(({ value, label, price, description }) => (
        <RadioCardsItem key={value} value={value}>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">
              {label} — {price}
            </span>
            <span className="text-xs text-ui-muted">{description}</span>
          </div>
        </RadioCardsItem>
      ))}
    </RadioCards>
  );
}
