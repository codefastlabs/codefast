import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { Button } from "#/components/button";
import { Label } from "#/components/label";
import { Textarea } from "#/components/textarea";

const meta = {
  component: Textarea,
  title: "Form/Textarea",
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-full max-w-xs space-y-2">
      <Label htmlFor="textarea-feedback">Your feedback</Label>
      <Textarea
        id="textarea-feedback"
        className="resize-none"
        rows={3}
        placeholder="What did you think? Share your thoughts…"
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Markdown supported.</p>
        <Button size="sm">Send</Button>
      </div>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-full max-w-xs space-y-2">
      <Label htmlFor="textarea-disabled">Message</Label>
      <Textarea id="textarea-disabled" placeholder="Type your message here." disabled />
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="w-full max-w-xs space-y-2">
      <Label htmlFor="textarea-invalid">Message</Label>
      <Textarea id="textarea-invalid" placeholder="Type your message here." aria-invalid />
    </div>
  ),
};

/** Interaction test — runs in a real browser via `vitest run --project=storybook`. */
export const Typing: Story = {
  render: () => <Textarea aria-label="Message" placeholder="Type your message here." />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole("textbox", { name: "Message" });

    await userEvent.type(textarea, "Hello there");
    await expect(textarea).toHaveValue("Hello there");
  },
};
