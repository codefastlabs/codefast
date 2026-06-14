import { Checkbox } from "@codefast/ui/checkbox";
import { Input } from "@codefast/ui/input";
import { Label } from "@codefast/ui/label";

export function LabelDemo() {
  return (
    <div className="space-y-4">
      <div className="grid gap-1.5">
        <Label htmlFor="lbl-email">Email address</Label>
        <Input id="lbl-email" placeholder="you@example.com" type="email" />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="lbl-terms" />
        <Label htmlFor="lbl-terms">Accept terms and conditions</Label>
      </div>
      <div className="flex items-center gap-2 opacity-50">
        <Checkbox disabled id="lbl-disabled" />
        <Label htmlFor="lbl-disabled">Disabled option</Label>
      </div>
    </div>
  );
}
