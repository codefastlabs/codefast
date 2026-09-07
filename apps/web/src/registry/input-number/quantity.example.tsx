import { InputNumber, InputNumberField, InputNumberStepper } from "@codefast/ui/input-number";
import { Label } from "@codefast/ui/label";

export function InputNumberQuantity() {
  return (
    <div className="grid w-full max-w-xs gap-1.5">
      <Label htmlFor="qty">Quantity</Label>
      <InputNumber id="qty" defaultValue={1} min={0} max={99}>
        <InputNumberField />
        <InputNumberStepper />
      </InputNumber>
      <p className="text-xs text-ui-muted">Use the steppers or type — clamped to 0–99.</p>
    </div>
  );
}
