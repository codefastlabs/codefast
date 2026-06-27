import { expect, fn } from "storybook/test";

import { Button } from "#/components/button";
import { Label } from "#/components/label";
import { Textarea } from "#/components/textarea";

import preview from "../.storybook/preview";

/**
 * Textarea — a prop-driven leaf wrapping a native `<textarea>`. The root owns no
 * variants of its own; it forwards every native textarea attribute (`placeholder`,
 * `rows`, `disabled`, `aria-invalid`, …) and styles the element. Content here is
 * authored against the component's own public API, independent of the apps/web registry.
 */
const meta = preview.meta({
  args: { "aria-label": "Message", disabled: false, placeholder: "Type your message here.", rows: 3 },
  argTypes: {
    "aria-label": { table: { disable: true } },
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
    rows: { control: { type: "number", min: 1, max: 20, step: 1 } },
  },
  component: Textarea,
  parameters: {
    controls: { include: ["placeholder", "rows", "disabled"] },
    docs: {
      description: {
        component:
          "Multi-line free-text input. A thin styled wrapper over the native `<textarea>` — it forwards every native attribute (`placeholder`, `rows`, `disabled`, `aria-invalid`) and auto-grows via `field-sizing-content`.",
      },
    },
  },
  title: "Form/Textarea",
});

export const Default = meta.story({
  render: (args) => (
    <div className="w-full max-w-xs">
      <Textarea {...args} />
    </div>
  ),
});

export const Disabled = meta.story({
  args: { disabled: true },
  render: Default.input.render,
});

export const Invalid = meta.story({
  args: { "aria-invalid": true },
  render: Default.input.render,
});

/** A genuinely different composition: labelled field with helper text and a submit action. */
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

export const Typing = meta.story({
  args: { onChange: fn() },
  render: Default.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
Typing.test("types a message and fires onChange", async ({ args, canvas, userEvent }) => {
  const textarea = canvas.getByRole("textbox", { name: "Message" });

  await userEvent.type(textarea, "Hello there");
  await expect(textarea).toHaveValue("Hello there");
  await expect(args.onChange).toHaveBeenCalled();
});
