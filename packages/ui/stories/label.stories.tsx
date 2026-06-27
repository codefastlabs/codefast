import { expect } from "storybook/test";

import { Input } from "#/components/input";
import { Label } from "#/components/label";

import preview from "../.storybook/preview";

/**
 * Label — a prop-driven leaf that renders a Radix `Label.Root` (`<label>`). Its
 * one meaningful prop is `htmlFor`, which associates the label with a form
 * control so clicking the label focuses it. Content is authored for Storybook,
 * not synced with the apps/web registry.
 */
const meta = preview.meta({
  args: { children: "Email address", htmlFor: "lbl-email" },
  argTypes: {
    children: { control: "text" },
    htmlFor: { control: "text" },
  },
  component: Label,
  parameters: {
    controls: { include: ["children", "htmlFor"] },
    docs: {
      description: {
        component:
          "Accessible caption for a form control. Set `htmlFor` to a control's `id` so clicking the label focuses (or toggles) that control.\n\n**Anatomy:** `Label[htmlFor]` paired with a control sharing the same `id`.",
      },
    },
  },
  title: "Form/Label",
});

export const Default = meta.story();

export const WithInput = meta.story({
  render: ({ children, htmlFor, ...props }) => (
    <div className="grid w-full max-w-xs gap-1.5">
      <Label htmlFor={htmlFor} {...props}>
        {children}
      </Label>
      <Input id={htmlFor} placeholder="you@example.com" type="email" />
    </div>
  ),
});

export const Required = meta.story({
  args: {
    children: (
      <>
        Full name <span className="text-destructive">*</span>
      </>
    ),
    htmlFor: "lbl-email",
  },
  render: WithInput.input.render,
});

WithInput.test("clicking the label focuses its associated input", async ({ args, canvas, userEvent }) => {
  await userEvent.click(canvas.getByText(args.children as string));

  await expect(canvas.getByPlaceholderText("you@example.com")).toHaveFocus();
});
