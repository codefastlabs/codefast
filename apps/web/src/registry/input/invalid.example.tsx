import { Field, FieldDescription, FieldLabel } from "@codefast/ui/field";
import { Input } from "@codefast/ui/input";

export function InputInvalid() {
  return (
    <Field data-invalid>
      <FieldLabel htmlFor="input-invalid">Invalid Input</FieldLabel>
      <Input id="input-invalid" placeholder="Error" aria-invalid />
      <FieldDescription>This field contains validation errors.</FieldDescription>
    </Field>
  );
}
