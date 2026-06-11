import { InputPassword } from "@codefast/ui/input-password";
import { Label } from "@codefast/ui/label";

export function InputPasswordDemo() {
  return (
    <div className="w-full max-w-xs space-y-3">
      <div className="grid gap-1.5">
        <Label htmlFor="pw-current">Current password</Label>
        <InputPassword id="pw-current" placeholder="••••••••" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="pw-new">New password</Label>
        <InputPassword id="pw-new" placeholder="Min. 8 characters" />
      </div>
    </div>
  );
}
