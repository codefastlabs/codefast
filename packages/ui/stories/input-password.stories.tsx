import { useState } from "react";
import { expect, fn } from "storybook/test";

import { InputPassword } from "#/components/input-password";
import { Label } from "#/components/label";

import preview from "../.storybook/preview";

/**
 * InputPassword — a prop-driven leaf input that owns a built-in show/hide
 * toggle. It forwards native `<input>` attributes (placeholder, disabled,
 * readOnly, value, onChange) and internally swaps `type` between "password"
 * and "text" while flipping the toggle button's aria-label.
 *
 * Content here is authored against the component's own public API for
 * Storybook — it is NOT synced with or copied from the apps/web registry.
 */
const meta = preview.meta({
  args: { disabled: false, placeholder: "••••••••", readOnly: false },
  argTypes: {
    disabled: { control: "boolean" },
    onChange: { table: { disable: true } },
    placeholder: { control: "text" },
    readOnly: { control: "boolean" },
    value: { table: { disable: true } },
  },
  component: InputPassword,
  parameters: {
    controls: { include: ["placeholder", "disabled", "readOnly"] },
    docs: {
      description: {
        component:
          "Password field with a built-in show/hide toggle. The visibility toggle swaps the input `type` between `password` and `text` and updates its aria-label (`Show password` ↔ `Hide password`).\n\n**Anatomy:** `InputGroup > (InputGroupInput + InputGroupButton)`.",
      },
    },
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

export const Disabled = meta.story({
  args: { disabled: true },
  render: Default.input.render,
});

export const ReadOnly = meta.story({
  args: { readOnly: true, value: "correct-horse" },
  render: Default.input.render,
});

/** A genuinely different composition: two fields with live mismatch validation. */
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

export const TogglesVisibility = meta.story({
  args: { onChange: fn() },
  render: Default.input.render,
});

TogglesVisibility.test("toggle flips the input type and aria-label", async ({ args, canvas, userEvent }) => {
  const input = canvas.getByLabelText("Current password");

  await userEvent.type(input, "s3cret");
  await expect(args.onChange).toHaveBeenCalled();
  await expect(input).toHaveAttribute("type", "password");

  const toggle = canvas.getByRole("button", { name: "Show password" });
  await userEvent.click(toggle);

  await expect(input).toHaveAttribute("type", "text");
  await expect(canvas.getByRole("button", { name: "Hide password" })).toBeInTheDocument();

  await userEvent.click(canvas.getByRole("button", { name: "Hide password" }));
  await expect(input).toHaveAttribute("type", "password");
});
