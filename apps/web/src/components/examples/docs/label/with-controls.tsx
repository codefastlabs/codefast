import { Checkbox } from "@codefast/ui/checkbox";
import { Input } from "@codefast/ui/input";
import { Label } from "@codefast/ui/label";

export function LabelWithControls() {
  return (
    <div className="w-full max-w-xs space-y-4">
      <div className="grid gap-1.5">
        <Label htmlFor="label-email">Email address</Label>
        <Input id="label-email" type="email" placeholder="you@example.com" />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="label-terms" />
        <Label htmlFor="label-terms">Accept terms and conditions</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="label-disabled" disabled />
        <Label htmlFor="label-disabled" className="opacity-50">
          Disabled option
        </Label>
      </div>
    </div>
  );
}
