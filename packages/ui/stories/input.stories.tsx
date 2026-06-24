import { expect } from "storybook/test";

import { Input } from "#/components/input";
import { Label } from "#/components/label";

import preview from "../.storybook/preview";

const meta = preview.meta({
  args: { disabled: false, placeholder: "you@example.com", type: "email" },
  argTypes: {
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "search", "tel", "url"],
    },
  },
  component: Input,
  parameters: {
    controls: { include: ["type", "placeholder", "disabled"] },
  },
  title: "Form/Input",
});

export const Default = meta.story({
  render: (args) => (
    <div className="grid w-full max-w-xs gap-1.5">
      <Label htmlFor="input-default">Email address</Label>
      <Input id="input-default" {...args} />
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
