import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "#/components/input";
import { Label } from "#/components/label";

const meta = {
  args: { children: "Email address" },
  component: Label,
  title: "Form/Label",
} satisfies Meta<typeof Label>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithInput: Story = {
  render: () => (
    <div className="grid w-full max-w-xs gap-1.5">
      <Label htmlFor="lbl-email">Email address</Label>
      <Input id="lbl-email" placeholder="you@example.com" type="email" />
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <div className="grid w-full max-w-xs gap-1.5">
      <Label htmlFor="lbl-required">
        Full name <span className="text-destructive">*</span>
      </Label>
      <Input id="lbl-required" placeholder="Jane Doe" required />
    </div>
  ),
};
