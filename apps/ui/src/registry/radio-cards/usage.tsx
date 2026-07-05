import { RadioCards, RadioCardsItem } from "@codefast/ui/radio-cards";

export function RadioCardsUsage() {
  return (
    <RadioCards className="grid grid-cols-2 gap-3" defaultValue="starter">
      <RadioCardsItem value="starter">Starter</RadioCardsItem>
      <RadioCardsItem value="pro">Pro</RadioCardsItem>
    </RadioCards>
  );
}
