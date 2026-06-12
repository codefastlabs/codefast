import { Field, FieldDescription, FieldLabel, FieldLegend, FieldSet } from "@codefast/ui/field";
import { Input } from "@codefast/ui/input";
import { Switch } from "@codefast/ui/switch";

export function FieldLayouts() {
  return (
    <div className="w-full max-w-xs space-y-5">
      <Field>
        <FieldLabel htmlFor="layout-name">Display name</FieldLabel>
        <Input id="layout-name" placeholder="Ada Lovelace" />
        <FieldDescription>Shown on your public profile.</FieldDescription>
      </Field>

      <Field orientation="horizontal">
        <FieldLabel htmlFor="layout-dms">Allow direct messages</FieldLabel>
        <Switch id="layout-dms" defaultChecked />
      </Field>

      <FieldSet>
        <FieldLegend>Notifications</FieldLegend>
        <Field orientation="horizontal">
          <FieldLabel htmlFor="layout-email">Email</FieldLabel>
          <Switch id="layout-email" defaultChecked />
        </Field>
        <Field orientation="horizontal">
          <FieldLabel htmlFor="layout-push">Push</FieldLabel>
          <Switch id="layout-push" />
        </Field>
      </FieldSet>
    </div>
  );
}
