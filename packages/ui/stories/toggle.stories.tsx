import { BoldIcon, ItalicIcon } from "lucide-react";
import { expect, fn } from "storybook/test";

import { Toggle } from "#/components/toggle";

import preview from "../.storybook/preview";

/**
 * Toggle — a prop-driven leaf wrapping Radix `Toggle.Root`. The root owns every
 * interesting prop (`variant`, `size`, `disabled`, `defaultPressed`), so `{...args}`
 * drives the rendered button directly. Content is authored for Storybook against the
 * component's own public API, independent of the apps/web registry.
 */
const meta = preview.meta({
  args: {
    "aria-label": "Italic",
    children: <ItalicIcon />,
    defaultPressed: false,
    disabled: false,
    size: "default",
    variant: "default",
  },
  argTypes: {
    asChild: { table: { disable: true } },
    children: { table: { disable: true } },
    defaultPressed: { control: "boolean" },
    disabled: { control: "boolean" },
    onPressedChange: { table: { disable: true } },
    pressed: { table: { disable: true } },
    size: { control: "radio", options: ["default", "sm", "lg"] },
    variant: { control: "radio", options: ["default", "outline"] },
  },
  component: Toggle,
  parameters: {
    controls: { include: ["variant", "size", "defaultPressed", "disabled"] },
    docs: {
      description: {
        component:
          "A two-state button that can be on or off. Press to toggle the `aria-pressed` state. Comes in `default`/`outline` variants and three sizes.",
      },
    },
  },
  title: "Form/Toggle",
});

export const Default = meta.story();

export const WithText = meta.story({
  args: {
    "aria-label": "Toggle italic",
    children: (
      <>
        <ItalicIcon />
        Italic
      </>
    ),
  },
});

export const Outline = meta.story({
  args: {
    "aria-label": "Toggle italic",
    children: (
      <>
        <ItalicIcon />
        Italic
      </>
    ),
    variant: "outline",
  },
});

export const Large = meta.story({
  args: { "aria-label": "Toggle large", children: "Large", size: "lg" },
});

export const Disabled = meta.story({
  args: { "aria-label": "Toggle disabled", children: "Disabled", disabled: true },
});

export const PressesOnClick = meta.story({
  args: { "aria-label": "Toggle bold", children: <BoldIcon />, onPressedChange: fn() },
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
PressesOnClick.test(
  "flips aria-pressed and fires onPressedChange when clicked",
  async ({ args, canvas, userEvent }) => {
    const toggle = canvas.getByRole("button", { name: "Toggle bold" });

    await expect(toggle).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(toggle);

    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(args.onPressedChange).toHaveBeenCalledWith(true);
  },
);
