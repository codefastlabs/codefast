import { expect, fn } from "storybook/test";

import { Input } from "#/components/input";
import { Label } from "#/components/label";

import preview from "../.storybook/preview";

/**
 * Input — a prop-driven leaf. The root is a native `<input>` (`ComponentProps<"input">`),
 * so every interesting state (type, placeholder, disabled, aria-invalid) is driven by
 * `args` on the root. Content is authored for Storybook against the component's own API —
 * NOT synced with or copied from the apps/web registry.
 */
const meta = preview.meta({
  args: { disabled: false, placeholder: "you@example.com", type: "email" },
  argTypes: {
    "aria-invalid": { control: "boolean" },
    disabled: { control: "boolean" },
    onChange: { table: { disable: true } },
    placeholder: { control: "text" },
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "search", "tel", "url"],
    },
  },
  component: Input,
  parameters: {
    controls: { include: ["type", "placeholder", "disabled", "aria-invalid"] },
    docs: {
      description: {
        component:
          "A native text field styled with focus, disabled, and invalid states. Pair with `Label` via `htmlFor`/`id`. Supports any HTML `type` (text, email, password, file, …).",
      },
    },
  },
  title: "Form/Input",
});

export const Default = meta.story({
  render: (args) => (
    <div className="grid w-full max-w-xs gap-1.5">
      <Label htmlFor="input-field">Email address</Label>
      <Input id="input-field" {...args} />
    </div>
  ),
});

export const Disabled = meta.story({
  args: { disabled: true },
  render: Default.input.render,
});

export const Invalid = meta.story({
  args: { "aria-invalid": true, placeholder: "Enter a valid email" },
  render: Default.input.render,
});

/** A genuinely different composition: native file picker has its own layout. */
export const File = meta.story({
  argTypes: { type: { table: { disable: true } } },
  render: () => (
    <div className="grid w-full max-w-xs gap-1.5">
      <Label htmlFor="input-file">Picture</Label>
      <Input id="input-file" type="file" />
    </div>
  ),
});

export const Typing = meta.story({
  args: { onChange: fn(), placeholder: "Type your name", type: "text" },
  render: Default.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
Typing.test("accepts typed input and fires onChange", async ({ args, canvas, userEvent }) => {
  const input = canvas.getByRole("textbox", { name: "Email address" });

  await userEvent.type(input, "Ada Lovelace");
  await expect(input).toHaveValue("Ada Lovelace");
  await expect(args.onChange).toHaveBeenCalled();
});
