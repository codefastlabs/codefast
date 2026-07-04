import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from "#/components/bubble";

import preview from "../.storybook/preview";

/**
 * Bubble — a chat message bubble. The `variant` paints the nested
 * `BubbleContent` so the color follows the author regardless of alignment.
 * Content here is authored against Bubble's own public API for Storybook, NOT
 * synced with the apps/web registry.
 *
 * **Anatomy:** `BubbleGroup > Bubble > BubbleContent (+ BubbleReactions?)`.
 */
const meta = preview.meta({
  args: { align: "start", variant: "default" },
  argTypes: {
    align: { control: "radio", options: ["start", "end"] },
    variant: {
      control: "radio",
      options: ["default", "secondary", "muted", "tinted", "outline", "ghost", "destructive"],
    },
  },
  component: Bubble,
  parameters: {
    controls: { include: ["variant", "align"] },
    docs: {
      description: {
        component:
          "A message bubble with seven color variants and start/end alignment. Compose with `BubbleGroup` to stack a run of bubbles and `BubbleReactions` to overlap a reaction pill.",
      },
    },
  },
  subcomponents: { BubbleContent, BubbleGroup, BubbleReactions },
  title: "Chat/Bubble",
});

export const Default = meta.story({
  render: (args) => (
    <Bubble {...args}>
      <BubbleContent>Hey! Are we still on for tomorrow?</BubbleContent>
    </Bubble>
  ),
});

export const Conversation = meta.story({
  render: () => (
    <div className="flex w-full max-w-md flex-col gap-2">
      <Bubble variant="muted">
        <BubbleContent>Hey! Are we still on for tomorrow?</BubbleContent>
      </Bubble>
      <Bubble align="end">
        <BubbleContent>Absolutely — 10am works.</BubbleContent>
      </Bubble>
    </div>
  ),
});

export const WithReactions = meta.story({
  render: () => (
    <BubbleGroup className="w-full max-w-md">
      <Bubble align="end" variant="default">
        <BubbleContent>Shipped it 🚀</BubbleContent>
        <BubbleReactions>🎉 3</BubbleReactions>
      </Bubble>
    </BubbleGroup>
  ),
});
