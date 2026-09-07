import { Checkbox } from "@codefast/ui/checkbox";
import { Label } from "@codefast/ui/label";

export function LabelDemo() {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  );
}
