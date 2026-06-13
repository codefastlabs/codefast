import { Field, FieldDescription, FieldGroup, FieldLabel } from "@codefast/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@codefast/ui/input-group";

export function InputGroupBlockEnd() {
  return (
    <FieldGroup className="max-w-sm">
      <Field>
        <FieldLabel htmlFor="block-end-input">Input</FieldLabel>
        <InputGroup className="h-auto">
          <InputGroupInput id="block-end-input" placeholder="Enter amount" />
          <InputGroupAddon align="block-end">
            <InputGroupText>USD</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
        <FieldDescription>Footer positioned below the input.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="block-end-textarea">Textarea</FieldLabel>
        <InputGroup>
          <InputGroupTextarea id="block-end-textarea" placeholder="Write a comment..." />
          <InputGroupAddon align="block-end">
            <InputGroupText>0/280</InputGroupText>
            <InputGroupButton variant="default" size="sm" className="ms-auto">
              Post
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <FieldDescription>Footer positioned below the textarea.</FieldDescription>
      </Field>
    </FieldGroup>
  );
}
