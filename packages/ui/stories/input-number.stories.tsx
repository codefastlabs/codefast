import type { Meta, StoryObj } from "@storybook/react-vite";

import { InputNumber } from "#/components/input-number";
import { Label } from "#/components/label";

const meta = {
  component: InputNumber,
  title: "Form/InputNumber",
} satisfies Meta<typeof InputNumber>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="grid w-full max-w-xs gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="qty">Quantity</Label>
        <InputNumber defaultValue={1} id="qty" max={99} min={0} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="price">Price ($)</Label>
        <InputNumber
          defaultValue={9.99}
          formatOptions={{ currency: "USD", style: "currency" }}
          id="price"
          min={0}
          step={0.01}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="cart">Cart quantity</Label>
        <InputNumber defaultValue={2} id="cart" max={10} min={0} variant="split" />
      </div>
    </div>
  ),
};

export const Formats: Story = {
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
};

export const States: Story = {
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
};
