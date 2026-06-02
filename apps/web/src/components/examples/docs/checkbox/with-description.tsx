import { Checkbox } from "@codefast/ui/checkbox";
import { Label } from "@codefast/ui/label";

export function CheckboxWithDescription() {
  return (
    <div className="flex w-full max-w-xs items-start gap-2.5">
      <Checkbox id="terms" defaultChecked className="mt-0.5" />
      <div className="grid gap-1">
        <Label htmlFor="terms">Accept terms and conditions</Label>
        <p className="text-xs leading-relaxed text-ui-muted">
          You agree to our Terms of Service and Privacy Policy. You can revoke consent any time.
        </p>
      </div>
    </div>
  );
}
