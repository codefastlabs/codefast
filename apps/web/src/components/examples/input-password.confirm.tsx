import { InputPassword } from "@codefast/ui/input-password";
import { Label } from "@codefast/ui/label";
import { useState } from "react";

export function InputPasswordConfirm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const mismatch = confirm.length > 0 && password !== confirm;

  return (
    <div className="w-full max-w-xs space-y-3">
      <div className="grid gap-1.5">
        <Label htmlFor="pw-confirm-new">New password</Label>
        <InputPassword
          id="pw-confirm-new"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
          }}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="pw-confirm-repeat">Confirm password</Label>
        <InputPassword
          id="pw-confirm-repeat"
          value={confirm}
          aria-invalid={mismatch || undefined}
          onChange={(event) => {
            setConfirm(event.target.value);
          }}
        />
        {mismatch ? <p className="text-xs text-rose-500">Passwords don’t match.</p> : null}
      </div>
    </div>
  );
}
