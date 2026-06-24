import { Label } from "#/components/label";
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "#/components/native-select";

import preview from "../.storybook/preview";

const meta = preview.meta({
  args: { disabled: false, size: "default" },
  argTypes: {
    disabled: { control: "boolean" },
    size: { control: "radio", options: ["default", "sm"] },
  },
  component: NativeSelect,
  subcomponents: { NativeSelectOptGroup, NativeSelectOption },
  parameters: {
    controls: { include: ["size", "disabled"] },
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

export const Disabled = meta.story({
  render: () => (
    <NativeSelect disabled>
      <NativeSelectOption value="">Disabled</NativeSelectOption>
      <NativeSelectOption value="apple">Apple</NativeSelectOption>
      <NativeSelectOption value="banana">Banana</NativeSelectOption>
      <NativeSelectOption value="blueberry">Blueberry</NativeSelectOption>
    </NativeSelect>
  ),
});

export const Invalid = meta.story({
  render: () => (
    <NativeSelect aria-invalid="true">
      <NativeSelectOption value="">Error state</NativeSelectOption>
      <NativeSelectOption value="apple">Apple</NativeSelectOption>
      <NativeSelectOption value="banana">Banana</NativeSelectOption>
      <NativeSelectOption value="blueberry">Blueberry</NativeSelectOption>
    </NativeSelect>
  ),
});
