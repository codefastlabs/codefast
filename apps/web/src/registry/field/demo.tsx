import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@codefast/ui/field";
import { Input } from "@codefast/ui/input";
import { Switch } from "@codefast/ui/switch";
import { Textarea } from "@codefast/ui/textarea";

export function FieldDemo() {
  return (
    <FieldGroup className="w-full max-w-md gap-6">
      <Field>
        <FieldLabel htmlFor="field-name">Display name</FieldLabel>
        <Input id="field-name" defaultValue="Vuong Phan" />
        <FieldDescription>Shown on your public profile.</FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="field-bio">Bio</FieldLabel>
        <Textarea id="field-bio" className="resize-none" rows={2} placeholder="Tell us a little about yourself" />
        <FieldDescription>Brief description for your profile. Max 160 characters.</FieldDescription>
      </Field>

      <FieldSeparator />

      <FieldSet className="gap-4">
        <FieldLegend variant="label">Email notifications</FieldLegend>
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="field-product">Product updates</FieldLabel>
            <FieldDescription>News about features and releases.</FieldDescription>
          </FieldContent>
          <Switch id="field-product" defaultChecked />
        </Field>
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="field-security">Security alerts</FieldLabel>
            <FieldDescription>Important activity on your account.</FieldDescription>
          </FieldContent>
          <Switch id="field-security" defaultChecked />
        </Field>
      </FieldSet>
    </FieldGroup>
  );
}
