import { Field, FieldLabel } from "@codefast/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@codefast/ui/input-group";
import { InfoIcon } from "lucide-react";

export function InputInputGroup() {
  return (
    <Field>
      <FieldLabel htmlFor="input-group-url">Website URL</FieldLabel>
      <InputGroup>
        <InputGroupInput id="input-group-url" placeholder="example.com" />
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <InfoIcon />
        </InputGroupAddon>
      </InputGroup>
    </Field>
  );
}
