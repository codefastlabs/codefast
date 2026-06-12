import { Button } from "@codefast/ui/button";
import { Field, FieldError, FieldLabel } from "@codefast/ui/field";
import { Input } from "@codefast/ui/input";
import { InputPassword } from "@codefast/ui/input-password";
import type { FormEvent } from "react";
import { useState } from "react";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function FormSignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [done, setDone] = useState(false);

  const emailInvalid = touched && !EMAIL.test(email);
  const passwordInvalid = touched && password.length < 8;

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setTouched(true);
    if (EMAIL.test(email) && password.length >= 8) {
      setDone(true);
    }
  }

  return (
    <form noValidate className="w-full max-w-xs space-y-4" onSubmit={submit}>
      <Field>
        <FieldLabel htmlFor="signin-email">Email</FieldLabel>
        <Input
          id="signin-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          aria-invalid={emailInvalid || undefined}
          onChange={(event) => {
            setEmail(event.target.value);
            setDone(false);
          }}
        />
        {emailInvalid ? <FieldError>Enter a valid email.</FieldError> : null}
      </Field>
      <Field>
        <FieldLabel htmlFor="signin-password">Password</FieldLabel>
        <InputPassword
          id="signin-password"
          placeholder="Min. 8 characters"
          value={password}
          aria-invalid={passwordInvalid || undefined}
          onChange={(event) => {
            setPassword(event.target.value);
            setDone(false);
          }}
        />
        {passwordInvalid ? <FieldError>At least 8 characters.</FieldError> : null}
      </Field>
      <Button type="submit" className="w-full">
        {done ? "Signed in ✓" : "Sign in"}
      </Button>
    </form>
  );
}
