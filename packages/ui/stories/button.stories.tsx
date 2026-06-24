import { expect } from "storybook/test";

import { Button } from "#/components/button";

import preview from "../.storybook/preview";

const meta = preview.meta({
  args: { children: "Button", size: "default", variant: "default" },
  argTypes: {
    asChild: { table: { disable: true } },
    children: { control: "text" },
    disabled: { control: "boolean" },
    size: {
      control: "select",
      options: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"],
    },
    variant: {
      control: "radio",
      options: ["default", "secondary", "destructive", "outline", "ghost", "link"],
    },
  },
  component: Button,
  parameters: {
    controls: { include: ["variant", "size", "children", "disabled"] },
  },
  title: "Form/Button",
});

export const Default = meta.story();

export const Secondary = meta.story({
  args: { variant: "secondary" },
});

export const Destructive = meta.story({
  args: { variant: "destructive" },
});

export const Outline = meta.story({
  args: { variant: "outline" },
});

export const Ghost = meta.story({
  args: { variant: "ghost" },
});

export const Link = meta.story({
  args: { variant: "link" },
});

export const Clickable = meta.story({
  args: { children: "Click me" },
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
Clickable.test("can be clicked", async ({ canvas, userEvent }) => {
  const button = canvas.getByRole("button", { name: "Click me" });

  await userEvent.click(button);
  await expect(button).toBeInTheDocument();
});
