import { Checkbox } from "@codefast/ui/checkbox";
import { Label } from "@codefast/ui/label";
import { useState } from "react";

export function CheckboxDemo() {
  const [checked, setChecked] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Checkbox id="c1" checked={checked} onCheckedChange={(v) => setChecked(!!v)} />
        <Label htmlFor="c1">Accept terms and conditions</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="c2" defaultChecked />
        <Label htmlFor="c2">Subscribe to newsletter</Label>
      </div>
      <div className="flex items-center gap-2 opacity-50">
        <Checkbox id="c3" disabled />
        <Label htmlFor="c3">Disabled option</Label>
      </div>
    </div>
  );
}
