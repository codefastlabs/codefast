import { Input } from "@codefast/ui/input";
import { Label } from "@codefast/ui/label";

export function InputDefault() {
  return (
    <div className="grid w-full max-w-xs gap-1.5">
      <Label htmlFor="input-email">Email address</Label>
      <Input id="input-email" type="email" placeholder="you@example.com" />
      <p className="text-xs text-ui-muted">We’ll never share your email.</p>
    </div>
  );
}
