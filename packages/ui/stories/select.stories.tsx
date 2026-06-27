import { expect, screen } from "storybook/test";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "#/components/select";

import preview from "../.storybook/preview";

/**
 * Select — a COMPOSITE built on Radix Select. The root (`Select`) owns the form-level
 * props (`dir`, `disabled`, `required`, `name`) and manages open/value state for you,
 * while the visible parts are composed from sub-components. The root is a normal
 * component (not a discriminated union), so `component` binding + `{...args}` drives
 * working Controls. Content is authored for Storybook, not synced with the apps/web registry.
 */
const meta = preview.meta({
  args: { dir: "ltr", disabled: false, required: false },
  argTypes: {
    dir: { control: "radio", options: ["ltr", "rtl"] },
    disabled: { control: "boolean" },
    onOpenChange: { table: { disable: true } },
    onValueChange: { table: { disable: true } },
    open: { table: { disable: true } },
    required: { control: "boolean" },
    value: { table: { disable: true } },
  },
  component: Select,
  parameters: {
    controls: { include: ["dir", "disabled", "required"] },
    docs: {
      description: {
        component: [
          "A control that lets users pick a single value from a list shown in a popover.",
          "",
          "**Anatomy:** `Select > SelectTrigger (SelectValue) + SelectContent > SelectGroup > (SelectLabel + SelectItem + SelectSeparator)`.",
          "Built on Radix Select — manages open/value state for you; pass `value`/`onValueChange` to control it.",
        ].join("\n"),
      },
    },
  },
  subcomponents: {
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectGroup,
    SelectLabel,
    SelectItem,
    SelectSeparator,
    SelectScrollUpButton,
    SelectScrollDownButton,
  },
  title: "Form/Select",
});

export const Default = meta.story({
  render: (args) => (
    <Select {...args}>
      <SelectTrigger className="w-44">
        <SelectValue placeholder="Choose framework" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Framework</SelectLabel>
          <SelectItem value="react">React</SelectItem>
          <SelectItem value="vue">Vue</SelectItem>
          <SelectItem value="svelte">Svelte</SelectItem>
          <SelectItem value="solid">Solid</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
});

/** Disabled is a state of the base composition — only `args` differ, render is reused. */
export const Disabled = meta.story({
  args: { disabled: true },
  render: Default.input.render,
});

/**
 * Groups is a genuinely different composition: two labelled groups split by a
 * `SelectSeparator`, so it warrants its own render.
 */
export const Groups = meta.story({
  render: (args) => (
    <Select {...args}>
      <SelectTrigger className="w-full max-w-48">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="blueberry">Blueberry</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Vegetables</SelectLabel>
          <SelectItem value="carrot">Carrot</SelectItem>
          <SelectItem value="broccoli">Broccoli</SelectItem>
          <SelectItem value="spinach">Spinach</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
});

export const SelectsOption = meta.story({
  render: Default.input.render,
});

/**
 * Interaction test (CSF Next `.test()`) — opening the popover reveals options in a
 * portal, so they are queried via `screen`; clicking one updates the trigger value.
 */
SelectsOption.test("commits the chosen option to the trigger", async ({ canvas, userEvent }) => {
  const trigger = canvas.getByRole("combobox");

  await expect(trigger).toHaveTextContent("Choose framework");

  await userEvent.click(trigger);

  const option = await screen.findByRole("option", { name: "Svelte" });

  await userEvent.click(option);
  await expect(trigger).toHaveTextContent("Svelte");
});
