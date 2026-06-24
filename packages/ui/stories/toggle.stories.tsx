import type { Meta, StoryObj } from "@storybook/react-vite";
import { BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react";
import { expect, userEvent, within } from "storybook/test";

import { Toggle } from "#/components/toggle";

const meta = {
  args: { "aria-label": "Italic", children: <ItalicIcon /> },
  component: Toggle,
  title: "Form/Toggle",
} satisfies Meta<typeof Toggle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
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
};

export const WithText: Story = {
  args: {
    "aria-label": "Toggle italic",
    children: (
      <>
        <ItalicIcon />
        Italic
      </>
    ),
  },
};

export const Outline: Story = {
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
};

export const Large: Story = {
  args: { "aria-label": "Toggle large", size: "lg", children: "Large" },
};

export const Disabled: Story = {
  args: { "aria-label": "Toggle disabled", disabled: true, children: "Disabled" },
};

/** Interaction test — runs in a real browser via `vitest run --project=storybook`. */
export const PressesOnClick: Story = {
  args: { "aria-label": "Toggle bold", children: <BoldIcon /> },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: "Toggle bold" });

    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
  },
};
