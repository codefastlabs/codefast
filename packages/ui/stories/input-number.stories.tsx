import { InputNumber } from "#/components/input-number";
import { Label } from "#/components/label";

import preview from "../.storybook/preview";

const meta = preview.meta({
  args: { defaultValue: 1, disabled: false, max: 99, min: 0, step: 1, variant: "stepper" },
  argTypes: {
    defaultValue: { control: "number" },
    disabled: { control: "boolean" },
    max: { control: "number" },
    min: { control: "number" },
    step: { control: "number" },
    variant: { control: "radio", options: ["stepper", "split"] },
  },
  component: InputNumber,
  parameters: {
    controls: { include: ["variant", "defaultValue", "min", "max", "step", "disabled"] },
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

export const Formats = meta.story({
  render: () => (
    <div className="grid w-full max-w-xs gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="fmt-price">Price</Label>
        <InputNumber
          id="fmt-price"
          defaultValue={9.99}
          min={0}
          step={0.01}
          formatOptions={{ style: "currency", currency: "USD" }}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="fmt-cart">Cart quantity (split)</Label>
        <InputNumber id="fmt-cart" defaultValue={2} min={0} max={10} variant="split" />
      </div>
    </div>
  ),
});

export const States = meta.story({
  render: () => (
    <div className="grid w-full max-w-xs gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="in-disabled">Disabled</Label>
        <InputNumber id="in-disabled" defaultValue={5} disabled />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="in-invalid">Invalid</Label>
        <InputNumber id="in-invalid" defaultValue={150} min={0} max={100} aria-invalid />
      </div>
    </div>
  ),
});
