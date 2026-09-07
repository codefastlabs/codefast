import { Button } from "@codefast/ui/button";
import { Field } from "@codefast/ui/field";
import { Input } from "@codefast/ui/input";

export function InputInline() {
  return (
    <Field orientation="horizontal">
      <Input type="search" placeholder="Search..." />
      <Button>Search</Button>
    </Field>
  );
}
