import { InputNumber } from "@codefast/ui/input-number";
import { Label } from "@codefast/ui/label";

export function InputNumberStates() {
  return (
    <div className="grid w-full max-w-xs gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="in-disabled">Disabled</Label>
        <InputNumber id="in-disabled" defaultValue={5} disabled />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="in-invalid">Invalid</Label>
        <InputNumber id="in-invalid" defaultValue={150} min={0} max={100} aria-invalid />
        <p className="text-xs text-rose-500">Must be 100 or less.</p>
      </div>
    </div>
  );
}
