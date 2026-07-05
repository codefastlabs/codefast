import { docSource, docUsage } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { MessageActions } from "#/registry/message/actions.example";
import { MessageAvatarDemo } from "#/registry/message/avatar.example";
import { MessageGroupDemo } from "#/registry/message/group.example";
import { MessageHeaderFooter } from "#/registry/message/header-footer.example";
import { MessageMarkdown } from "#/registry/message/markdown.example";
import { MessageAttachment } from "#/registry/message/message-attachment.example";
import { MessageThread } from "#/registry/message/thread.example";

export const messageDoc: ComponentDoc = {
  usage: docUsage("message"),
  examples: [
    {
      id: "message-thread",
      title: "Thread",
      description:
        "Compose MessageGroup with alternating Message rows. The avatar, header, and footer are optional per row.",
      Demo: MessageThread,
      source: docSource("message", "thread"),
    },
    {
      id: "message-avatar",
      title: "Avatar",
      description: "Attach an author avatar with MessageAvatar; consecutive same-author rows can drop it.",
      Demo: MessageAvatarDemo,
      source: docSource("message", "avatar"),
    },
    {
      id: "message-group",
      title: "Group",
      description: "MessageGroup stacks related rows; an empty MessageAvatar keeps content aligned without a picture.",
      Demo: MessageGroupDemo,
      source: docSource("message", "group"),
    },
    {
      id: "message-header-footer",
      title: "Header and footer",
      description: "Put the author name in MessageHeader and delivery status in MessageFooter as real text.",
      Demo: MessageHeaderFooter,
      source: docSource("message", "header-footer"),
    },
    {
      id: "message-actions",
      title: "Actions",
      description: "Put per-message controls (copy, react, retry) in MessageFooter; it aligns with the row.",
      Demo: MessageActions,
      source: docSource("message", "actions"),
    },
    {
      id: "message-attachment",
      title: "With attachments",
      description: "Compose Attachment inside MessageContent to send and receive files alongside bubbles.",
      Demo: MessageAttachment,
      source: docSource("message", "message-attachment"),
    },
    {
      id: "message-markdown",
      title: "Markdown",
      description: "Render assistant text in a ghost bubble as plain paragraphs; keep user messages as plain text.",
      Demo: MessageMarkdown,
      source: docSource("message", "markdown"),
    },
  ],
  anatomy: [
    {
      name: "MessageGroup",
      children: [
        {
          name: "Message",
          children: [
            { name: "MessageAvatar" },
            { name: "MessageContent", children: [{ name: "MessageHeader" }, { name: "MessageFooter" }] },
          ],
        },
      ],
    },
  ],
  features: [
    'align="end" reverses the row (avatar/content order) for the current user\'s own messages — no manual flex-direction needed.',
    "MessageAvatar lifts above MessageFooter automatically when a footer is present, so it doesn't collide with delivery-status text.",
    "Designed to sit inside MessageScroller for long, keyboard- and screen-reader-navigable transcripts.",
  ],
  api: [
    {
      name: "Message",
      description: "A single message row: avatar plus content column.",
      props: [
        {
          name: "align",
          type: '"start" | "end"',
          default: '"start"',
          description: "Which author side the row belongs to; 'end' reverses the row direction.",
        },
      ],
    },
    {
      name: "MessageContent",
      description: "Column holding the bubbles and metadata; end-aligned rows self-align their children.",
      props: [{ name: "children", type: "ReactNode", description: "Bubbles, MessageHeader, MessageFooter." }],
    },
    {
      name: "MessageAvatar / MessageHeader / MessageFooter",
      description: "Optional author avatar and metadata rows.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "Avatar element, or header/footer text such as name, time, and status.",
        },
      ],
    },
    {
      name: "MessageGroup",
      description: "Vertical stack of related messages.",
      props: [{ name: "children", type: "ReactNode", description: "One or more Message rows." }],
    },
  ],
  accessibility: {
    notes: [
      "Message is presentational; put author and time in MessageHeader/MessageFooter as real text, not color or side alone.",
      "Row direction and spacing mirror automatically under a DirectionProvider (RTL).",
      "For long feeds, render messages inside MessageScroller so keyboard and screen-reader users can navigate the transcript.",
    ],
  },
  guidelines: {
    do: [
      "Use align='end' for the current user's messages and 'start' for others.",
      "Attach avatars to incoming messages and drop them on consecutive same-author rows.",
    ],
    dont: [
      "Don’t convey the author with alignment alone — keep a visible name or avatar.",
      "Don’t hard-code left/right; use align so the row mirrors in RTL.",
    ],
  },
  related: ["bubble", "message-scroller", "avatar"],
};
