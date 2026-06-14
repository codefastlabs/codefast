import { RadioCards, RadioCardsItem } from "@codefast/ui/radio-cards";
import { useState } from "react";

const PLANS = [
  { value: "free", label: "Free", price: "$0 / mo", description: "For personal projects" },
  { value: "pro", label: "Pro", price: "$12 / mo", description: "For professional use" },
  { value: "team", label: "Team", price: "$49 / mo", description: "For growing teams" },
];

export function RadioCardsPlans() {
  const [plan, setPlan] = useState("pro");
  const current = PLANS.find((item) => item.value === plan);

  return (
    <div className="w-full max-w-xs space-y-3">
      <RadioCards className="grid gap-2" value={plan} onValueChange={setPlan}>
        {PLANS.map(({ value, label, price, description }) => (
          <RadioCardsItem key={value} value={value}>
            <div className="flex flex-col gap-0.5 text-start">
              <span className="text-sm font-medium">
                {label} — {price}
              </span>
              <span className="text-xs text-ui-muted">{description}</span>
            </div>
          </RadioCardsItem>
        ))}
      </RadioCards>
      <p className="text-center text-xs text-ui-muted">
        Current plan: <span className="font-medium text-ui-fg">{current?.label}</span>
      </p>
    </div>
  );
}
