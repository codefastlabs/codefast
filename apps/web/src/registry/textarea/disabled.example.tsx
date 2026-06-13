import { Field, FieldLabel } from "@codefast/ui/field";
import { Textarea } from "@codefast/ui/textarea";

export function TextareaDisabled() {
  return (
    <Field data-disabled>
      <FieldLabel htmlFor="textarea-disabled">Message</FieldLabel>
      <Textarea id="textarea-disabled" placeholder="Type your message here." disabled />
    </Field>
  );
}
