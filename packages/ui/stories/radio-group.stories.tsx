import { expect, fn } from "storybook/test";

import { Label } from "#/components/label";
import { RadioGroup, RadioGroupItem } from "#/components/radio-group";

import preview from "../.storybook/preview";

const DENSITY_OPTIONS = ["compact", "comfortable", "spacious"] as const;

/**
 * RadioGroup — a COMPOSITE whose root (`RadioGroup`) is a normal Radix component that owns
 * the interesting props (`orientation`, `loop`, `disabled`, `defaultValue`), so it binds
 * `component` and lets `{...args}` drive Controls. Items are plain children paired with a
 * `Label`. Content is authored for Storybook, not synced with the apps/web registry.
 */
const meta = preview.meta({
  args: { defaultValue: "comfortable", disabled: false, loop: true, orientation: "vertical" },
  argTypes: {
    asChild: { table: { disable: true } },
    defaultValue: { control: "select", options: DENSITY_OPTIONS },
    disabled: { control: "boolean" },
    loop: { control: "boolean" },
    onValueChange: { table: { disable: true } },
    orientation: { control: "radio", options: ["horizontal", "vertical"] },
    value: { table: { disable: true } },
  },
  component: RadioGroup,
  parameters: {
    controls: { include: ["defaultValue", "disabled", "loop", "orientation"] },
    docs: {
      description: {
        component: [
          "A set of mutually exclusive options where only one can be selected at a time.",
          "",
          "**Anatomy:** `RadioGroup > RadioGroupItem`.",
          "Drive it with `value`/`defaultValue` + `onValueChange`; pair each item with a `Label`.",
        ].join("\n"),
      },
    },
  },
  subcomponents: { RadioGroupItem },
  title: "Form/RadioGroup",
});

export const Default = meta.story({
  render: (args) => (
    <RadioGroup {...args}>
      {DENSITY_OPTIONS.map((value) => (
        <div key={value} className="flex items-center gap-2">
          <RadioGroupItem id={`radio-${value}`} value={value} />
          <Label className="capitalize" htmlFor={`radio-${value}`}>
            {value}
          </Label>
        </div>
      ))}
    </RadioGroup>
  ),
});

export const Horizontal = meta.story({
  args: { orientation: "horizontal" },
  render: Default.input.render,
});

export const Disabled = meta.story({
  args: { disabled: true },
  render: Default.input.render,
});

export const Invalid = meta.story({
  render: () => (
    <RadioGroup defaultValue="comfortable">
      {DENSITY_OPTIONS.map((value) => (
        <div key={value} className="flex items-center gap-2">
          <RadioGroupItem aria-invalid id={`invalid-${value}`} value={value} />
          <Label className="capitalize" htmlFor={`invalid-${value}`}>
            {value}
          </Label>
        </div>
      ))}
    </RadioGroup>
  ),
});

export const ChecksOnClick = meta.story({
  args: { defaultValue: undefined, onValueChange: fn() },
  render: Default.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
ChecksOnClick.test("selects an option and reports the new value", async ({ args, canvas, userEvent }) => {
  const compact = canvas.getByRole("radio", { name: "compact" });
  const spacious = canvas.getByRole("radio", { name: "spacious" });

  await userEvent.click(compact);
  await expect(compact).toBeChecked();
  await expect(args.onValueChange).toHaveBeenCalledWith("compact");

  // Single-select contract: picking another option deselects the first.
  await userEvent.click(spacious);
  await expect(spacious).toBeChecked();
  await expect(compact).not.toBeChecked();
});
