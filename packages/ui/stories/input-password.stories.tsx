import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { InputPassword } from "#/components/input-password";
import { Label } from "#/components/label";

const meta = {
  component: InputPassword,
  title: "Form/InputPassword",
} satisfies Meta<typeof InputPassword>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
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
  ),
};

export const Confirm: Story = {
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
};
