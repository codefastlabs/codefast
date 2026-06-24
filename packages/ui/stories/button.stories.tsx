import { expect } from "storybook/test";

import { Button } from "#/components/button";

import preview from "../.storybook/preview";

const meta = preview.meta({
  args: { children: "Button" },
  component: Button,
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
