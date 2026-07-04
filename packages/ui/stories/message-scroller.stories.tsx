import { Avatar, AvatarFallback } from "#/components/avatar";
import { Bubble, BubbleContent } from "#/components/bubble";
import { Message, MessageAvatar, MessageContent, MessageHeader } from "#/components/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "#/components/message-scroller";

import preview from "../.storybook/preview";

const TURNS = Array.from({ length: 12 }, (_, index) => ({
  author: index % 2 === 0 ? "Ada" : "You",
  align: index % 2 === 0 ? ("start" as const) : ("end" as const),
  text:
    index % 2 === 0
      ? `Message ${(index + 1).toString()}: here is some context for the demo feed.`
      : `Reply ${(index + 1).toString()}: sounds good, thanks!`,
}));

/**
 * MessageScroller — a headless scroll controller for chat transcripts:
 * follow-the-bottom, prepend preservation, anchored turns, and a scroll-to-edge
 * button. Content here is authored against its own public API for Storybook,
 * NOT synced with the apps/web registry.
 *
 * **Anatomy:** `MessageScrollerProvider > MessageScroller > MessageScrollerViewport >
 * MessageScrollerContent > MessageScrollerItem*` with an optional `MessageScrollerButton`.
 */
const meta = preview.meta({
  component: MessageScroller,
  parameters: {
    docs: {
      description: {
        component:
          "A scroll manager for chat feeds. The provider owns follow-bottom, prepend preservation, and anchored-turn behavior; the button appears only when there is overflow toward its direction.",
      },
    },
    layout: "fullscreen",
  },
  subcomponents: {
    MessageScrollerButton,
    MessageScrollerContent,
    MessageScrollerItem,
    MessageScrollerProvider,
    MessageScrollerViewport,
  },
  title: "Chat/MessageScroller",
});

export const Default = meta.story({
  render: () => (
    <div className="h-96 w-full max-w-md rounded-xl border p-2">
      <MessageScrollerProvider autoScroll defaultScrollPosition="end">
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent>
              {TURNS.map((turn, index) => (
                <MessageScrollerItem
                  key={turn.text}
                  scrollAnchor={turn.align === "start"}
                  messageId={`m${index.toString()}`}
                >
                  <Message align={turn.align}>
                    {turn.align === "start" ? (
                      <MessageAvatar>
                        <Avatar size="sm">
                          <AvatarFallback>AD</AvatarFallback>
                        </Avatar>
                      </MessageAvatar>
                    ) : null}
                    <MessageContent>
                      {turn.align === "start" ? <MessageHeader>{turn.author}</MessageHeader> : null}
                      <Bubble align={turn.align} variant={turn.align === "start" ? "muted" : "default"}>
                        <BubbleContent>{turn.text}</BubbleContent>
                      </Bubble>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
    </div>
  ),
});
