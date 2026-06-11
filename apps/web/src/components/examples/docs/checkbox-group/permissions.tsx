import { CheckboxGroup, CheckboxGroupItem } from "@codefast/ui/checkbox-group";
import { Label } from "@codefast/ui/label";
import { useState } from "react";

const PERMISSIONS = [
  { value: "read", label: "Read" },
  { value: "write", label: "Write" },
  { value: "delete", label: "Delete" },
  { value: "admin", label: "Admin", disabled: true },
];

export function CheckboxGroupPermissions() {
  const [selected, setSelected] = useState<Array<string>>(["read", "write"]);

  return (
    <div className="space-y-3">
      <CheckboxGroup className="gap-3" value={selected} onValueChange={(value) => setSelected(value ?? [])}>
        {PERMISSIONS.map(({ value, label, disabled }) => (
          <div key={value} className="flex items-center gap-2">
            <CheckboxGroupItem id={`perm-${value}`} value={value} {...(disabled ? { disabled } : {})} />
            <Label htmlFor={`perm-${value}`} className={disabled ? "opacity-50" : ""}>
              {label}
            </Label>
          </div>
        ))}
      </CheckboxGroup>
      <p className="text-xs text-ui-muted">
        Granted: <span className="font-medium text-ui-fg">{selected.join(", ") || "none"}</span>
      </p>
    </div>
  );
}
