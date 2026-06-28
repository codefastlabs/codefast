import { Field, FieldDescription, FieldLabel } from "@codefast/ui/field";
import { Input } from "@codefast/ui/input";

export function LabelInField() {
  return (
    <Field className="mx-auto w-full max-w-sm">
      <FieldLabel htmlFor="label-field-email">Email address</FieldLabel>
      <Input id="label-field-email" type="email" placeholder="you@example.com" />
      <FieldDescription>We’ll only use this to send you receipts.</FieldDescription>
    </Field>
  );
}
