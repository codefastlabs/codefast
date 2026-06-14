import { Button } from "@codefast/ui/button";
import { Field, FieldDescription, FieldLabel } from "@codefast/ui/field";
import { Input } from "@codefast/ui/input";
import { useState } from "react";

export function FormDemo() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
    }, 2000);
  }

  return (
    <form className="w-full max-w-xs space-y-4" onSubmit={handleSubmit}>
      <Field>
        <FieldLabel htmlFor="form-email">Email</FieldLabel>
        <Input id="form-email" placeholder="you@example.com" required type="email" />
      </Field>
      <Field>
        <FieldLabel htmlFor="form-password">Password</FieldLabel>
        <Input id="form-password" placeholder="••••••••" required type="password" />
        <FieldDescription>At least 8 characters.</FieldDescription>
      </Field>
      <Button className="w-full" type="submit">
        {submitted ? "Signed in!" : "Sign in"}
      </Button>
    </form>
  );
}
