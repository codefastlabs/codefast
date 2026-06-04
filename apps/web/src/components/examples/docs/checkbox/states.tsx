import { Checkbox } from "@codefast/ui/checkbox";
import { Label } from "@codefast/ui/label";

export function CheckboxStates() {
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2.5">
        <Checkbox id="cb-default" />
        <Label htmlFor="cb-default">Default</Label>
      </div>
      <div className="flex items-center gap-2.5">
        <Checkbox id="cb-checked" defaultChecked />
        <Label htmlFor="cb-checked">Checked</Label>
      </div>
      <div className="flex items-center gap-2.5 opacity-50">
        <Checkbox id="cb-disabled" disabled />
        <Label htmlFor="cb-disabled">Disabled</Label>
      </div>
      <div className="flex items-center gap-2.5 opacity-50">
        <Checkbox id="cb-disabled-checked" disabled defaultChecked />
        <Label htmlFor="cb-disabled-checked">Disabled checked</Label>
      </div>
    </div>
  );
}
