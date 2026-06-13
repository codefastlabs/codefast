import { Field, FieldLabel } from "@codefast/ui/field";
import { Switch } from "@codefast/ui/switch";

export function FieldSwitch() {
  return (
    <Field orientation="horizontal" className="w-fit">
      <FieldLabel htmlFor="2fa">Multi-factor authentication</FieldLabel>
      <Switch id="2fa" />
    </Field>
  );
}
