import { Button } from "@codefast/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@codefast/ui/field";
import { Input } from "@codefast/ui/input";
import { Textarea } from "@codefast/ui/textarea";
import type { FormEvent } from "react";
import { useState } from "react";

export function FormContact() {
  const [message, setMessage] = useState("");
  const [touched, setTouched] = useState(false);

  const invalid = touched && message.trim().length < 10;

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setTouched(true);
  }

  return (
    <form noValidate className="w-full max-w-xs space-y-4" onSubmit={submit}>
      <Field>
        <FieldLabel htmlFor="contact-name">Name</FieldLabel>
        <Input id="contact-name" placeholder="Ada Lovelace" />
      </Field>
      <Field>
        <FieldLabel htmlFor="contact-message">Message</FieldLabel>
        <Textarea
          id="contact-message"
          rows={3}
          className="resize-none"
          placeholder="How can we help?"
          value={message}
          aria-invalid={invalid || undefined}
          onChange={(event) => {
            setMessage(event.target.value);
          }}
        />
        {invalid ? (
          <FieldError>Please write at least 10 characters.</FieldError>
        ) : (
          <FieldDescription>We typically reply within a day.</FieldDescription>
        )}
      </Field>
      <Button type="submit" className="w-full">
        Send message
      </Button>
    </form>
  );
}
