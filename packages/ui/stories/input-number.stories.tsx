import { expect, fn, waitFor } from "storybook/test";

import { InputNumber } from "#/components/input-number";
import { Label } from "#/components/label";

import preview from "../.storybook/preview";

/**
 * InputNumber — a prop-driven leaf. The root <InputNumber> is a single
 * component that owns every interesting prop (variant, min/max/step,
 * formatOptions, disabled) and renders its own stepper/split buttons
 * internally, so `{...args}` drives it directly. Content is authored against
 * the component's own public API for Storybook — it is NOT synced with the
 * apps/web registry.
 */
const meta = preview.meta({
  args: { defaultValue: 1, disabled: false, max: 99, min: 0, step: 1, variant: "stepper" },
  argTypes: {
    defaultValue: { control: "number" },
    disabled: { control: "boolean" },
    max: { control: "number" },
    min: { control: "number" },
    onChange: { table: { disable: true } },
    step: { control: "number" },
    value: { table: { disable: true } },
    variant: { control: "radio", options: ["split", "stepper"] },
  },
  component: InputNumber,
  parameters: {
    controls: { include: ["variant", "defaultValue", "min", "max", "step", "disabled"] },
    docs: {
      description: {
        component:
          "A numeric input with increment/decrement controls. The `stepper` variant stacks a chevron column on the trailing edge; the `split` variant places minus/plus buttons on each side. Supports `min`/`max`/`step` clamping and `Intl.NumberFormat` display via `formatOptions`.",
      },
    },
  },
  title: "Form/InputNumber",
});

export const Default = meta.story({
  render: (args) => (
    <div className="grid w-full max-w-xs gap-1.5">
      <Label htmlFor="input-number-default">Quantity</Label>
      <InputNumber id="input-number-default" {...args} />
    </div>
  ),
});

export const Split = meta.story({
  args: { variant: "split", defaultValue: 2, max: 10 },
  render: Default.input.render,
});

export const Currency = meta.story({
  args: { defaultValue: 9.99, step: 0.01, formatOptions: { currency: "USD", style: "currency" } },
  render: Default.input.render,
});

export const Disabled = meta.story({
  args: { disabled: true, defaultValue: 5 },
  render: Default.input.render,
});

export const Invalid = meta.story({
  args: { defaultValue: 150, max: 100, "aria-invalid": true },
  render: Default.input.render,
});

export const Steps = meta.story({
  args: { onChange: fn() },
  render: Default.input.render,
});

Steps.test("increment button raises the value and fires onChange", async ({ args, canvas, userEvent }) => {
  const input = canvas.getByRole("textbox") as HTMLInputElement;
  const before = input.value;

  await userEvent.click(canvas.getByRole("button", { name: "Increment" }));

  await waitFor(() => expect(input.value).not.toBe(before));
  await expect(args.onChange).toHaveBeenCalled();
});
