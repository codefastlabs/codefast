import { Checkbox } from "@codefast/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@codefast/ui/field";
import { useState } from "react";

const permissions = [
  { id: "read", label: "Read", hint: "View content and settings" },
  { id: "write", label: "Write", hint: "Create and edit content" },
  { id: "manage", label: "Manage", hint: "Invite members and change roles" },
];

export function CheckboxIndeterminate() {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set(["read"]));

  const allChecked = checkedIds.size === permissions.length;
  const someChecked = checkedIds.size > 0 && !allChecked;
  const parentState = someChecked ? "indeterminate" : allChecked;

  const handleParentChange = (checked: boolean | "indeterminate") => {
    setCheckedIds(checked === true ? new Set(permissions.map((permission) => permission.id)) : new Set());
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
    <div className="mx-auto w-full max-w-xs rounded-xl border p-4">
      <FieldGroup>
        <Field orientation="horizontal">
          <Checkbox
            aria-label="Grant all permissions"
            checked={parentState}
            id="permissions-all"
            onCheckedChange={handleParentChange}
          />
          <FieldLabel htmlFor="permissions-all">All permissions</FieldLabel>
        </Field>
        <FieldGroup className="ms-6 gap-4">
          {permissions.map((permission) => (
            <Field key={permission.id} orientation="horizontal">
              <Checkbox
                checked={checkedIds.has(permission.id)}
                id={`permission-${permission.id}`}
                onCheckedChange={(checked) => {
                  handleChildChange(permission.id, checked);
                }}
              />
              <FieldLabel htmlFor={`permission-${permission.id}`} className="font-normal">
                {permission.label}
                <span className="block text-xs font-normal text-ui-muted">{permission.hint}</span>
              </FieldLabel>
            </Field>
          ))}
        </FieldGroup>
      </FieldGroup>
    </div>
  );
}
