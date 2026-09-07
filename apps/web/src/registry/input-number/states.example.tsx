import { InputNumber, InputNumberField, InputNumberStepper } from "@codefast/ui/input-number";
import { Label } from "@codefast/ui/label";

export function InputNumberStates() {
  return (
    <div className="grid w-full max-w-xs gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="in-disabled">Disabled</Label>
        <InputNumber id="in-disabled" defaultValue={5} disabled>
          <InputNumberField />
          <InputNumberStepper />
        </InputNumber>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="in-invalid">Invalid</Label>
        <InputNumber id="in-invalid" defaultValue={150} min={0} max={100}>
          <InputNumberField aria-invalid />
          <InputNumberStepper />
        </InputNumber>
        <p className="text-xs text-rose-500">Must be 100 or less.</p>
      </div>
    </div>
  );
}
