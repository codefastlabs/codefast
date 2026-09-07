import { CheckboxGroup, CheckboxGroupItem } from "@codefast/ui/checkbox-group";
import { Label } from "@codefast/ui/label";
import { useState } from "react";

const PERMISSIONS = [
  { value: "read", label: "Read" },
  { value: "write", label: "Write" },
  { value: "delete", label: "Delete" },
  { value: "admin", label: "Admin", disabled: true },
];

export function CheckboxGroupDemo() {
  const [selected, setSelected] = useState<Array<string>>(["read", "write"]);

  return (
    <CheckboxGroup
      className="gap-3"
      value={selected}
      onValueChange={(v) => {
        setSelected(v ?? []);
      }}
    >
      {PERMISSIONS.map(({ value, label, disabled }) => (
        <div key={value} className="flex items-center gap-2">
          <CheckboxGroupItem {...(disabled ? { disabled } : {})} id={`perm-${value}`} value={value} />
          <Label className={disabled ? "opacity-50" : ""} htmlFor={`perm-${value}`}>
            {label}
          </Label>
        </div>
      ))}
    </CheckboxGroup>
  );
}
