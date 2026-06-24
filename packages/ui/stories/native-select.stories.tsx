import { Label } from "#/components/label";
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "#/components/native-select";

import preview from "../.storybook/preview";

const meta = preview.meta({
  component: NativeSelect,
  title: "Form/NativeSelect",
});

export const Default = meta.story({
  render: () => (
    <div className="grid gap-1.5">
      <Label htmlFor="ns-country">Country</Label>
      <NativeSelect id="ns-country">
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
