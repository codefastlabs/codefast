import { Field, FieldDescription, FieldLabel } from "@codefast/ui/field";
import { Input } from "@codefast/ui/input";

export function FieldUsage() {
  return (
    <Field>
      <FieldLabel htmlFor="username">Username</FieldLabel>
      <Input id="username" placeholder="Leo Park" />
      <FieldDescription>Choose a unique username for your account.</FieldDescription>
    </Field>
  );
}
