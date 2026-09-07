import { Field, FieldDescription, FieldLabel } from "@codefast/ui/field";
import { Textarea } from "@codefast/ui/textarea";

export function TextareaInvalid() {
  return (
    <Field data-invalid>
      <FieldLabel htmlFor="textarea-invalid">Message</FieldLabel>
      <Textarea id="textarea-invalid" placeholder="Type your message here." aria-invalid />
      <FieldDescription>Please enter a valid message.</FieldDescription>
    </Field>
  );
}
