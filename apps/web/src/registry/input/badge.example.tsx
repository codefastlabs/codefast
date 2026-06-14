import { Badge } from "@codefast/ui/badge";
import { Field, FieldLabel } from "@codefast/ui/field";
import { Input } from "@codefast/ui/input";

export function InputBadge() {
  return (
    <Field>
      <FieldLabel htmlFor="input-badge">
        Webhook URL{" "}
        <Badge variant="secondary" className="ms-auto">
          Beta
        </Badge>
      </FieldLabel>
      <Input id="input-badge" type="url" placeholder="https://api.example.com/webhook" />
    </Field>
  );
}
