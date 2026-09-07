import { Field, FieldDescription, FieldLabel } from "@codefast/ui/field";
import { Input } from "@codefast/ui/input";

export function InputFile() {
  return (
    <Field>
      <FieldLabel htmlFor="picture">Picture</FieldLabel>
      <Input id="picture" type="file" />
      <FieldDescription>Select a picture to upload.</FieldDescription>
    </Field>
  );
}
