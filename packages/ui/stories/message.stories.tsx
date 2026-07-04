import { Avatar, AvatarFallback } from "#/components/avatar";
import { Bubble, BubbleContent } from "#/components/bubble";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "#/components/message";

import preview from "../.storybook/preview";

/**
 * Message — a chat row that arranges an avatar and content column. `align="end"`
 * mirrors the row for the current author. Content here is authored against
 * Message's own public API for Storybook, NOT synced with the apps/web registry.
 *
 * **Anatomy:** `MessageGroup > Message > MessageAvatar? + MessageContent >
 * (MessageHeader? + bubbles + MessageFooter?)`.
 */
const meta = preview.meta({
  args: { align: "start" },
  argTypes: {
    align: { control: "radio", options: ["start", "end"] },
  },
  component: Message,
  parameters: {
    controls: { include: ["align"] },
    docs: {
      description: {
        component:
          "A message row pairing an avatar with a content column. Compose with `MessageGroup`, `MessageHeader`/`MessageFooter`, and `Bubble` for a full chat thread.",
      },
    },
  },
  subcomponents: { MessageAvatar, MessageContent, MessageFooter, MessageGroup, MessageHeader },
  title: "Chat/Message",
});

export const Default = meta.story({
  render: (args) => (
    <Message {...args} className="w-full max-w-md">
      <MessageAvatar>
        <Avatar>
          <AvatarFallback>AD</AvatarFallback>
        </Avatar>
      </MessageAvatar>
      <MessageContent>
        <MessageHeader>Ada</MessageHeader>
        <Bubble variant="muted">
          <BubbleContent>Morning! Ready for the demo?</BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  ),
});

export const Thread = meta.story({
  render: () => (
    <MessageGroup className="w-full max-w-md">
      <Message>
        <MessageAvatar>
          <Avatar>
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <MessageHeader>Ada</MessageHeader>
          <Bubble variant="muted">
            <BubbleContent>Morning! Ready for the demo?</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessageContent>
          <Bubble align="end">
            <BubbleContent>Yep — joining now.</BubbleContent>
          </Bubble>
          <MessageFooter>Delivered</MessageFooter>
        </MessageContent>
      </Message>
    </MessageGroup>
  ),
});
