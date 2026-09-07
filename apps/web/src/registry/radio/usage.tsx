import { Label } from "@codefast/ui/label";
import { Radio } from "@codefast/ui/radio";

export function RadioUsage() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Radio defaultChecked id="plan-starter" name="plan" value="starter" />
        <Label htmlFor="plan-starter">Starter</Label>
      </div>
      <div className="flex items-center gap-2">
        <Radio id="plan-pro" name="plan" value="pro" />
        <Label htmlFor="plan-pro">Pro</Label>
      </div>
    </div>
  );
}
