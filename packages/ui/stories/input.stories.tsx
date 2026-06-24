import { expect } from "storybook/test";

import { Input } from "#/components/input";
import { Label } from "#/components/label";

import preview from "../.storybook/preview";

const meta = preview.meta({
  component: Input,
  title: "Form/Input",
});

export const Default = meta.story({
  render: () => (
    <div className="w-full max-w-xs space-y-3">
      <div className="grid gap-1.5">
        <Label htmlFor="demo-email">Email address</Label>
        <Input id="demo-email" type="email" placeholder="you@example.com" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="demo-password">Password</Label>
        <Input id="demo-password" type="password" placeholder="••••••••" />
      </div>
    </div>
  ),
});

export const Disabled = meta.story({
  render: () => (
    <div className="grid w-full max-w-xs gap-1.5">
      <Label htmlFor="input-disabled">Email</Label>
      <Input id="input-disabled" type="email" placeholder="Email" disabled />
    </div>
  ),
});

export const Invalid = meta.story({
  render: () => (
    <div className="grid w-full max-w-xs gap-1.5">
      <Label htmlFor="input-invalid">Invalid input</Label>
      <Input id="input-invalid" placeholder="Error" aria-invalid />
    </div>
  ),
});

export const File = meta.story({
  render: () => (
    <div className="grid w-full max-w-xs gap-1.5">
      <Label htmlFor="input-file">Picture</Label>
      <Input id="input-file" type="file" />
    </div>
  ),
});

export const Typing = meta.story({
  render: () => <Input aria-label="Name" placeholder="Type your name" />,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
Typing.test("types a value", async ({ canvas, userEvent }) => {
  const input = canvas.getByRole("textbox", { name: "Name" });

  await userEvent.type(input, "Ada Lovelace");
  await expect(input).toHaveValue("Ada Lovelace");
});
