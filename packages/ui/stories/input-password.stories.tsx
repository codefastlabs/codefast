import { useState } from "react";

import { InputPassword } from "#/components/input-password";
import { Label } from "#/components/label";

import preview from "../.storybook/preview";

const meta = preview.meta({
  args: { disabled: false, placeholder: "••••••••" },
  argTypes: {
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
  },
  component: InputPassword,
  parameters: {
    controls: { include: ["placeholder", "disabled"] },
  },
  title: "Form/InputPassword",
});

export const Default = meta.story({
  render: (args) => (
    <div className="grid w-full max-w-xs gap-1.5">
      <Label htmlFor="input-password-default">Current password</Label>
      <InputPassword id="input-password-default" {...args} />
    </div>
  ),
});

export const Confirm = meta.story({
  render: function ConfirmRender() {
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
          {mismatch ? <p className="text-sm text-rose-500">Passwords don’t match.</p> : null}
        </div>
      </div>
    );
  },
});
