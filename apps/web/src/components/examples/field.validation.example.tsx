import { Button } from "@codefast/ui/button";
import { Field, FieldError, FieldLabel } from "@codefast/ui/field";
import { Input } from "@codefast/ui/input";
import type { FormEvent } from "react";
import { useState } from "react";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function FieldValidation() {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [done, setDone] = useState(false);

  const invalid = touched && !EMAIL.test(email);

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setTouched(true);
    if (EMAIL.test(email)) {
      setDone(true);
    }
  }

  return (
    <form noValidate className="w-full max-w-xs space-y-4" onSubmit={submit}>
      <Field>
        <FieldLabel htmlFor="field-email">Work email</FieldLabel>
        <Input
          id="field-email"
          type="email"
          placeholder="you@company.com"
          value={email}
          aria-invalid={invalid || undefined}
          onChange={(event) => {
            setEmail(event.target.value);
            setDone(false);
          }}
        />
        {invalid ? <FieldError>Enter a valid email address.</FieldError> : null}
      </Field>
      <Button type="submit" className="w-full">
        {done ? "Subscribed ✓" : "Subscribe"}
      </Button>
    </form>
  );
}
