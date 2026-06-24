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
 * Subcomponents (the `SelectTrigger`/`SelectContent`/… tabs) get a docs-only
 * props table — Storybook Controls bind to one component, so they can't be made
 * interactive. The official workaround is to FLATTEN a subcomponent prop worth
 * controlling into the story args and pass it down in `render`: here
 * `contentPosition` drives `SelectContent`'s `position`.
 */
interface SelectArgs {
  contentPosition: "item-aligned" | "popper";
  dir: "ltr" | "rtl";
  disabled: boolean;
  required: boolean;
}

const meta = preview.type<{ args: SelectArgs }>().meta({
  args: { contentPosition: "item-aligned", dir: "ltr", disabled: false, required: false },
  argTypes: {
    contentPosition: { control: "radio", options: ["item-aligned", "popper"] },
    dir: { control: "radio", options: ["ltr", "rtl"] },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
  },
  subcomponents: {
    Select,
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
  parameters: {
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
  title: "Form/Select",
});

export const Default = meta.story({
  render: ({ contentPosition, ...args }) => (
    <Select {...args}>
      <SelectTrigger className="w-44">
        <SelectValue placeholder="Choose framework" />
      </SelectTrigger>
      <SelectContent position={contentPosition}>
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

export const Groups = meta.story({
  render: () => (
    <Select>
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

export const Disabled = meta.story({
  render: () => (
    <Select disabled>
      <SelectTrigger className="w-full max-w-48">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="blueberry">Blueberry</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
});

export const SelectsOption = meta.story({
  render: Default.input.render,
});

/** Interaction test (CSF Next `.test()`) — content is portalled, so options are queried via `screen`. */
SelectsOption.test("selects option", async ({ canvas, userEvent }) => {
  const trigger = canvas.getByRole("combobox");

  await userEvent.click(trigger);

  const option = await screen.findByRole("option", { name: "Svelte" });

  await userEvent.click(option);
  await expect(trigger).toHaveTextContent("Svelte");
});
