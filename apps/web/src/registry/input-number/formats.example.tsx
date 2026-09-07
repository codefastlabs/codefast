import {
  InputNumber,
  InputNumberDecrement,
  InputNumberField,
  InputNumberIncrement,
  InputNumberStepper,
} from "@codefast/ui/input-number";
import { Label } from "@codefast/ui/label";

export function InputNumberFormats() {
  return (
    <div className="grid w-full max-w-xs gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="price">Price</Label>
        <InputNumber
          id="price"
          defaultValue={9.99}
          min={0}
          step={0.01}
          formatOptions={{ style: "currency", currency: "USD" }}
        >
          <InputNumberField />
          <InputNumberStepper />
        </InputNumber>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="cart">Cart quantity (split)</Label>
        <InputNumber id="cart" defaultValue={2} min={0} max={10}>
          <InputNumberDecrement />
          <InputNumberField className="text-center" />
          <InputNumberIncrement />
        </InputNumber>
      </div>
    </div>
  );
}
