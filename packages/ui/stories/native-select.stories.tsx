import { expect, fn } from "storybook/test";

import { Label } from "#/components/label";
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "#/components/native-select";

import preview from "../.storybook/preview";

/**
 * NativeSelect — a prop-driven leaf wrapping a real `<select>`. The root owns the
 * interesting props (`size`, `disabled`, plus native `<select>` attributes like
 * `aria-invalid`), so `{...args}` drives every state and the option/optgroup children
 * stay constant. Content is authored for Storybook against the component's own public
 * API, independent of the apps/web registry.
 */
const meta = preview.meta({
  args: { disabled: false, size: "default" },
  argTypes: {
    "aria-invalid": { control: "boolean" },
    disabled: { control: "boolean" },
    onChange: { table: { disable: true } },
    size: { control: "radio", options: ["default", "sm"] },
  },
  component: NativeSelect,
  parameters: {
    controls: { include: ["size", "disabled", "aria-invalid"] },
    docs: {
      description: {
        component: [
          "A native `<select>` styled to match the design system, including custom size variants.",
          "",
          "**Anatomy:** `NativeSelect > (NativeSelectOptGroup > NativeSelectOption)`.",
          "Renders real `<select>`/`<optgroup>`/`<option>` elements — full form-control and mobile behaviour for free.",
        ].join("\n"),
      },
    },
  },
  subcomponents: { NativeSelectOptGroup, NativeSelectOption },
  title: "Form/NativeSelect",
});

export const Default = meta.story({
  render: (args) => (
    <div className="grid gap-1.5">
      <Label htmlFor="ns-country">Country</Label>
      <NativeSelect id="ns-country" {...args}>
        <NativeSelectOptGroup label="Asia">
          <NativeSelectOption value="vn">Vietnam</NativeSelectOption>
          <NativeSelectOption value="jp">Japan</NativeSelectOption>
          <NativeSelectOption value="kr">South Korea</NativeSelectOption>
        </NativeSelectOptGroup>
        <NativeSelectOptGroup label="Europe">
          <NativeSelectOption value="de">Germany</NativeSelectOption>
          <NativeSelectOption value="fr">France</NativeSelectOption>
        </NativeSelectOptGroup>
      </NativeSelect>
    </div>
  ),
});

export const Small = meta.story({ args: { size: "sm" }, render: Default.input.render });

export const Disabled = meta.story({ args: { disabled: true }, render: Default.input.render });

export const Invalid = meta.story({ args: { "aria-invalid": true }, render: Default.input.render });

export const SelectsOption = meta.story({ args: { onChange: fn() }, render: Default.input.render });

SelectsOption.test("emits change and updates value when an option is picked", async ({ args, canvas, userEvent }) => {
  const select = canvas.getByLabelText("Country");

  await userEvent.selectOptions(select, "jp");

  await expect(select).toHaveValue("jp");
  await expect(args.onChange).toHaveBeenCalled();
});
