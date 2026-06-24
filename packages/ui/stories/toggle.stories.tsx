import { BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react";
import { expect } from "storybook/test";

import { Toggle } from "#/components/toggle";

import preview from "../.storybook/preview";

const meta = preview.meta({
  args: { "aria-label": "Italic", children: <ItalicIcon /> },
  component: Toggle,
  title: "Form/Toggle",
});

export const Default = meta.story({
  render: () => (
    <div className="flex gap-1">
      <Toggle aria-label="Bold" size="sm">
        <BoldIcon />
      </Toggle>
      <Toggle aria-label="Italic" size="sm" defaultPressed>
        <ItalicIcon />
      </Toggle>
      <Toggle aria-label="Underline" size="sm">
        <UnderlineIcon />
      </Toggle>
    </div>
  ),
});

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
    variant: "outline",
    children: (
      <>
        <ItalicIcon />
        Italic
      </>
    ),
  },
});

export const Large = meta.story({
  args: { "aria-label": "Toggle large", size: "lg", children: "Large" },
});

export const Disabled = meta.story({
  args: {
    "aria-label": "Toggle disabled",
    disabled: true,
    children: "Disabled",
  },
});

export const PressesOnClick = meta.story({
  args: { "aria-label": "Toggle bold", children: <BoldIcon /> },
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
PressesOnClick.test("presses on click", async ({ canvas, userEvent }) => {
  const toggle = canvas.getByRole("button", { name: "Toggle bold" });

  await userEvent.click(toggle);
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
});
