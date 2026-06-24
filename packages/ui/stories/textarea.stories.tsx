import { expect } from "storybook/test";

import { Button } from "#/components/button";
import { Label } from "#/components/label";
import { Textarea } from "#/components/textarea";

import preview from "../.storybook/preview";

const meta = preview.meta({
  args: { disabled: false, placeholder: "Type your message here.", rows: 3 },
  argTypes: {
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
    rows: { control: { type: "number", min: 1, max: 20, step: 1 } },
  },
  component: Textarea,
  parameters: {
    controls: { include: ["placeholder", "rows", "disabled"] },
  },
  title: "Form/Textarea",
});

export const Default = meta.story({
  render: (args) => (
    <div className="w-full max-w-xs">
      <Textarea aria-label="Message" {...args} />
    </div>
  ),
});

export const Feedback = meta.story({
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
});

export const Disabled = meta.story({
  render: () => (
    <div className="w-full max-w-xs space-y-2">
      <Label htmlFor="textarea-disabled">Message</Label>
      <Textarea id="textarea-disabled" placeholder="Type your message here." disabled />
    </div>
  ),
});

export const Invalid = meta.story({
  render: () => (
    <div className="w-full max-w-xs space-y-2">
      <Label htmlFor="textarea-invalid">Message</Label>
      <Textarea id="textarea-invalid" placeholder="Type your message here." aria-invalid />
    </div>
  ),
});

export const Typing = meta.story({
  render: () => <Textarea aria-label="Message" placeholder="Type your message here." />,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
Typing.test("types a message", async ({ canvas, userEvent }) => {
  const textarea = canvas.getByRole("textbox", { name: "Message" });

  await userEvent.type(textarea, "Hello there");
  await expect(textarea).toHaveValue("Hello there");
});
