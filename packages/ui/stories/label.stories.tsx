import { Input } from "#/components/input";
import { Label } from "#/components/label";

import preview from "../.storybook/preview";

const meta = preview.meta({
  args: { children: "Email address" },
  argTypes: {
    children: { control: "text" },
  },
  component: Label,
  parameters: {
    controls: { include: ["children"] },
  },
  title: "Form/Label",
});

export const Default = meta.story();

export const WithInput = meta.story({
  render: () => (
    <div className="grid w-full max-w-xs gap-1.5">
      <Label htmlFor="lbl-email">Email address</Label>
      <Input id="lbl-email" placeholder="you@example.com" type="email" />
    </div>
  ),
});

export const Required = meta.story({
  render: () => (
    <div className="grid w-full max-w-xs gap-1.5">
      <Label htmlFor="lbl-required">
        Full name <span className="text-destructive">*</span>
      </Label>
      <Input id="lbl-required" placeholder="Jane Doe" required />
    </div>
  ),
});
