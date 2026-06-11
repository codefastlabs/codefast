import { Checkbox } from "@codefast/ui/checkbox";
import { Label } from "@codefast/ui/label";
import { useState } from "react";

const ITEMS = [
  { id: "marketing", label: "Marketing emails" },
  { id: "updates", label: "Product updates" },
  { id: "security", label: "Security alerts" },
];

export function CheckboxSelectAll() {
  const [checked, setChecked] = useState<Array<string>>(["security"]);

  const allChecked = checked.length === ITEMS.length;
  const someChecked = checked.length > 0 && !allChecked;

  function toggle(id: string, on: boolean): void {
    setChecked((previous) => (on ? [...previous, id] : previous.filter((value) => value !== id)));
  }

  return (
    <div className="w-full max-w-xs space-y-3">
      <div className="flex items-center gap-2.5">
        <Checkbox
          id="notify-all"
          checked={allChecked ? true : someChecked ? "indeterminate" : false}
          onCheckedChange={(value) => {
            setChecked(value === true ? ITEMS.map((item) => item.id) : []);
          }}
        />
        <Label htmlFor="notify-all" className="font-semibold">
          All notifications
        </Label>
      </div>
      <div className="space-y-2 border-l border-ui-border pl-4">
        {ITEMS.map((item) => (
          <div key={item.id} className="flex items-center gap-2.5">
            <Checkbox
              id={item.id}
              checked={checked.includes(item.id)}
              onCheckedChange={(value) => {
                toggle(item.id, value === true);
              }}
            />
            <Label htmlFor={item.id}>{item.label}</Label>
          </div>
        ))}
      </div>
    </div>
  );
}
