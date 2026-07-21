import {
  InputNumber,
  InputNumberDecrement,
  InputNumberField,
  InputNumberIncrement,
  InputNumberStepper,
} from "@codefast/ui/input-number";
import { Label } from "@codefast/ui/label";

export function InputNumberDemo() {
  return (
    <div className="grid w-full max-w-xs gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="qty">Quantity</Label>
        <InputNumber defaultValue={1} id="qty" max={99} min={0}>
          <InputNumberField />
          <InputNumberStepper />
        </InputNumber>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="price">Price ($)</Label>
        <InputNumber
          defaultValue={9.99}
          formatOptions={{ currency: "USD", style: "currency" }}
          id="price"
          min={0}
          step={0.01}
        >
          <InputNumberField />
          <InputNumberStepper />
        </InputNumber>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="cart">Cart quantity</Label>
        <InputNumber defaultValue={2} id="cart" max={10} min={0}>
          <InputNumberDecrement />
          <InputNumberField className="text-center" />
          <InputNumberIncrement />
        </InputNumber>
      </div>
    </div>
  );
}
