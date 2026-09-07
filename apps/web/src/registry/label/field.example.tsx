import { Field, FieldDescription, FieldGroup, FieldLabel } from "@codefast/ui/field";
import { Input } from "@codefast/ui/input";

export function LabelInField() {
  return (
    <FieldGroup className="mx-auto w-full max-w-sm">
      <Field>
        <FieldLabel htmlFor="label-field-name">Full name</FieldLabel>
        <Input id="label-field-name" placeholder="Ada Lovelace" />
      </Field>
      <Field>
        <FieldLabel htmlFor="label-field-email">Email address</FieldLabel>
        <Input id="label-field-email" placeholder="you@example.com" type="email" />
        <FieldDescription>We’ll only use this to send you receipts.</FieldDescription>
      </Field>
    </FieldGroup>
  );
}
