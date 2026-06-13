import { Badge } from "@codefast/ui/badge";
import { RadioCards, RadioCardsItem } from "@codefast/ui/radio-cards";
import { useState } from "react";

export function RadioCardsInterval() {
  const [interval, setInterval] = useState("yearly");

  return (
    <RadioCards className="grid w-full max-w-sm grid-cols-2 gap-2" value={interval} onValueChange={setInterval}>
      <RadioCardsItem value="monthly">
        <div className="flex flex-col gap-0.5 text-start">
          <span className="text-sm font-medium">Monthly</span>
          <span className="text-xs text-ui-muted">$12 billed each month</span>
        </div>
      </RadioCardsItem>
      <RadioCardsItem value="yearly">
        <div className="flex flex-col gap-0.5 text-start">
          <span className="flex items-center gap-2 text-sm font-medium">
            Yearly
            <Badge variant="secondary">−20%</Badge>
          </span>
          <span className="text-xs text-ui-muted">$115 billed once a year</span>
        </div>
      </RadioCardsItem>
    </RadioCards>
  );
}
