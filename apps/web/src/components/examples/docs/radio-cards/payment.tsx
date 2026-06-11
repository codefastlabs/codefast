import { RadioCards, RadioCardsItem } from "@codefast/ui/radio-cards";
import { CreditCardIcon, LandmarkIcon, WalletIcon } from "lucide-react";
import { useState } from "react";

const METHODS = [
  { value: "card", label: "Card", icon: CreditCardIcon },
  { value: "wallet", label: "Wallet", icon: WalletIcon },
  { value: "bank", label: "Bank", icon: LandmarkIcon },
];

export function RadioCardsPayment() {
  const [method, setMethod] = useState("card");

  return (
    <RadioCards className="grid w-full max-w-sm grid-cols-3 gap-2" value={method} onValueChange={setMethod}>
      {METHODS.map(({ value, label, icon: Icon }) => (
        <RadioCardsItem key={value} value={value}>
          <div className="flex flex-col items-center gap-1.5">
            <Icon className="size-5" />
            <span className="text-xs font-medium">{label}</span>
          </div>
        </RadioCardsItem>
      ))}
    </RadioCards>
  );
}
