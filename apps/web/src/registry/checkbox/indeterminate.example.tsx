import { Checkbox } from "@codefast/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@codefast/ui/field";
import { useState } from "react";

const items = [
  { id: "recents", label: "Recents" },
  { id: "home", label: "Home" },
  { id: "applications", label: "Applications" },
];

export function CheckboxIndeterminate() {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set(["home"]));

  const allChecked = checkedIds.size === items.length;
  const someChecked = checkedIds.size > 0 && !allChecked;
  const parentState = someChecked ? "indeterminate" : allChecked;

  const handleParentChange = (checked: boolean | "indeterminate") => {
    setCheckedIds(checked === true ? new Set(items.map((item) => item.id)) : new Set());
  };

  const handleChildChange = (id: string, checked: boolean | "indeterminate") => {
    setCheckedIds((previous) => {
      const next = new Set(previous);

      if (checked === true) {
        next.add(id);
      } else {
        next.delete(id);
      }

      return next;
    });
  };

  return (
    <FieldGroup className="mx-auto w-56">
      <Field orientation="horizontal">
        <Checkbox
          aria-label="Select all"
          id="parent-checkbox"
          checked={parentState}
          onCheckedChange={handleParentChange}
        />
        <FieldLabel htmlFor="parent-checkbox">Select all</FieldLabel>
      </Field>
      <FieldGroup className="ms-6 gap-3">
        {items.map((item) => (
          <Field key={item.id} orientation="horizontal">
            <Checkbox
              id={`child-${item.id}`}
              checked={checkedIds.has(item.id)}
              onCheckedChange={(checked) => {
                handleChildChange(item.id, checked);
              }}
            />
            <FieldLabel htmlFor={`child-${item.id}`}>{item.label}</FieldLabel>
          </Field>
        ))}
      </FieldGroup>
    </FieldGroup>
  );
}
