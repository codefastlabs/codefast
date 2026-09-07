import { CheckboxCards, CheckboxCardsItem } from "@codefast/ui/checkbox-cards";

export function CheckboxCardsUsage() {
  return (
    <CheckboxCards className="grid grid-cols-2 gap-3" defaultValue={["storage"]}>
      <CheckboxCardsItem value="storage">Extra storage</CheckboxCardsItem>
      <CheckboxCardsItem value="support">Priority support</CheckboxCardsItem>
    </CheckboxCards>
  );
}
