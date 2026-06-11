import { Button } from "@codefast/ui/button";
import { Checkbox } from "@codefast/ui/checkbox";
import { Field, FieldLabel } from "@codefast/ui/field";
import { Input } from "@codefast/ui/input";
import { Label } from "@codefast/ui/label";
import type { FormEvent } from "react";
import { useState } from "react";

export function FormNewsletter() {
  const [agreed, setAgreed] = useState(false);
  const [touched, setTouched] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setTouched(true);
  }

  return (
    <form noValidate className="w-full max-w-xs space-y-4" onSubmit={submit}>
      <Field>
        <FieldLabel htmlFor="news-email">Email</FieldLabel>
        <Input id="news-email" type="email" placeholder="you@example.com" />
      </Field>
      <div className="flex items-start gap-2">
        <Checkbox
          id="news-consent"
          checked={agreed}
          className="mt-0.5"
          onCheckedChange={(checked) => {
            setAgreed(checked === true);
          }}
        />
        <Label htmlFor="news-consent" className="text-xs leading-relaxed text-ui-muted">
          I agree to receive product news. Unsubscribe at any time.
        </Label>
      </div>
      {touched && !agreed ? <p className="text-xs text-rose-500">Please accept to continue.</p> : null}
      <Button type="submit" className="w-full">
        Subscribe
      </Button>
    </form>
  );
}
