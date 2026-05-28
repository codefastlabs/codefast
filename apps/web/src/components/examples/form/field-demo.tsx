import { Field, FieldDescription, FieldError, FieldLabel } from "@codefast/ui/field";
import { Input } from "@codefast/ui/input";

export function FieldDemo() {
  return (
    <div className="w-full max-w-xs space-y-4">
      <Field>
        <FieldLabel htmlFor="field-name">Full name</FieldLabel>
        <Input id="field-name" placeholder="John Doe" />
        <FieldDescription>Your name as it appears on your ID.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="field-email">Email</FieldLabel>
        <Input id="field-email" placeholder="you@example.com" type="email" />
        <FieldError>This field is required.</FieldError>
      </Field>
      <Field orientation="horizontal">
        <FieldLabel htmlFor="field-username">Username</FieldLabel>
        <Input id="field-username" placeholder="@handle" />
      </Field>
    </div>
  );
}
