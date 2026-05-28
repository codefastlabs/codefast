import { Label } from "@codefast/ui/label";
import { InputNumber } from "@codefast/ui/input-number";

export function InputNumberDemo() {
  return (
    <div className="w-full max-w-xs space-y-3">
      <div className="grid gap-1.5">
        <Label htmlFor="qty">Quantity</Label>
        <InputNumber defaultValue={1} id="qty" max={99} min={0} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="price">Price ($)</Label>
        <InputNumber
          defaultValue={9.99}
          formatOptions={{ currency: "USD", style: "currency" }}
          id="price"
          min={0}
          step={0.01}
        />
      </div>
    </div>
  );
}
