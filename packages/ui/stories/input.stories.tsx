import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { Input } from "#/components/input";
import { Label } from "#/components/label";

const meta = {
  component: Input,
  title: "Form/Input",
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
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
};

export const Disabled: Story = {
  render: () => (
    <div className="grid w-full max-w-xs gap-1.5">
      <Label htmlFor="input-disabled">Email</Label>
      <Input id="input-disabled" type="email" placeholder="Email" disabled />
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="grid w-full max-w-xs gap-1.5">
      <Label htmlFor="input-invalid">Invalid input</Label>
      <Input id="input-invalid" placeholder="Error" aria-invalid />
    </div>
  ),
};

export const File: Story = {
  render: () => (
    <div className="grid w-full max-w-xs gap-1.5">
      <Label htmlFor="input-file">Picture</Label>
      <Input id="input-file" type="file" />
    </div>
  ),
};

/** Interaction test — runs in a real browser via `vitest run --project=storybook`. */
export const Typing: Story = {
  render: () => <Input aria-label="Name" placeholder="Type your name" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Name" });

    await userEvent.type(input, "Ada Lovelace");
    await expect(input).toHaveValue("Ada Lovelace");
  },
};
