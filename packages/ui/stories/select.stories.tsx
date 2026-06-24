import { expect, screen } from "storybook/test";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "#/components/select";

import preview from "../.storybook/preview";

const meta = preview.meta({
  component: Select,
  title: "Form/Select",
});

export const Default = meta.story({
  render: () => (
    <Select>
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
