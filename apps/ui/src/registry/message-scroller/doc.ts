import { MessageScrollerDemo } from "#/registry/message-scroller/demo";
import { MessageScrollerScrollable } from "#/registry/message-scroller/scrollable.example";
import { docAnatomy, docDemo, docSource } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const messageScrollerDoc: ComponentDoc = {
  examples: [
    {
      id: "message-scroller-feed",
      title: "Chat feed",
      description:
        "MessageScrollerProvider owns the behavior; autoScroll follows new content at the bottom, defaultScrollPosition='end' opens at the latest turn, and MessageScrollerButton appears only while there is overflow toward its edge.",
      Demo: MessageScrollerDemo,
      source: docDemo("message-scroller"),
      previewClassName: "block",
    },
    {
      id: "message-scroller-scrollable",
      title: "Scrollable state",
      description:
        "useMessageScrollerScrollable reports which edges the viewport can still scroll toward — drive custom affordances from it.",
      Demo: MessageScrollerScrollable,
      source: docSource("message-scroller", "scrollable"),
      previewClassName: "block",
    },
  ],
  anatomy: docAnatomy("message-scroller"),
  api: [
    {
      name: "MessageScrollerProvider",
      description: "Owns scroll behavior and state; renders no DOM.",
      props: [
        {
          name: "autoScroll",
          type: "boolean",
          description: "Follow new content at the bottom while the viewport is already at the end.",
        },
        {
          name: "defaultScrollPosition",
          type: '"start" | "end" | "last-anchor"',
          description: "Opening position on the first non-empty render, applied once.",
        },
        {
          name: "scrollEdgeThreshold",
          type: "number",
          default: "8",
          description: "Distance from an edge that still counts as at-top/at-bottom.",
        },
        {
          name: "scrollPreviousItemPeek",
          type: "number",
          default: "64",
          description: "Extra top margin kept above a newly anchored row.",
        },
        {
          name: "scrollMargin",
          type: "number",
          default: "0",
          description: "Default aligned-edge margin for commands.",
        },
      ],
    },
    {
      name: "MessageScrollerViewport",
      description: "Scrollable viewport; owns native scroll events and prepend preservation.",
      props: [
        {
          name: "preserveScrollOnPrepend",
          type: "boolean",
          default: "true",
          description: "Keep the first visible row stable when content is prepended.",
        },
      ],
    },
    {
      name: "MessageScrollerItem",
      description: "One transcript row.",
      props: [
        {
          name: "messageId",
          type: "string",
          description: "Stable id for scrollToMessage, visibility, and prepend preservation.",
        },
        {
          name: "scrollAnchor",
          type: "boolean",
          default: "false",
          description: "Marks a turn boundary that appended anchors and last-anchor restore use.",
        },
      ],
    },
    {
      name: "MessageScrollerButton",
      description: "Scroll-to-edge control; hides itself when there is no overflow that way.",
      props: [
        {
          name: "direction",
          type: '"start" | "end"',
          default: '"end"',
          description: "Transcript edge to scroll toward.",
        },
        {
          name: "behavior",
          type: "ScrollBehavior",
          default: '"smooth"',
          description: "Native scroll behavior when clicked.",
        },
      ],
    },
    {
      name: "Hooks",
      description: "Read state from within a provider.",
      props: [
        {
          name: "useMessageScroller()",
          type: "context",
          description: "Imperative scroll commands (scrollToEnd/Start/Message).",
        },
        {
          name: "useMessageScrollerScrollable()",
          type: "{ start, end }",
          description: "Which edges can still scroll.",
        },
        {
          name: "useMessageScrollerVisibility()",
          type: "{ currentAnchorId, visibleMessageIds }",
          description: "Anchored turn and the ids intersecting the viewport.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["ArrowUp"], description: "Scroll the viewport up; releases follow-bottom." },
      { keys: ["ArrowDown"], description: "Scroll the viewport down." },
      { keys: ["PageUp"], description: "Scroll up by a viewport; releases follow-bottom." },
      { keys: ["PageDown"], description: "Scroll down by a viewport." },
      { keys: ["Home"], description: "Jump to the start of the transcript." },
      { keys: ["End"], description: "Jump to the end of the transcript." },
    ],
    notes: [
      "Deliberate keyboard or wheel scrolling releases follow-bottom so the reader is never yanked to the latest message.",
      "The viewport is a focusable scroll region; MessageScrollerButton is a real button with an accessible label per direction.",
      "Give each MessageScrollerItem a stable messageId so restore and prepend preservation stay correct.",
    ],
  },
  guidelines: {
    do: [
      "Mark each turn boundary with scrollAnchor so streaming replies anchor at the reading line.",
      "Compose the feed from Message and Bubble for consistent chat styling.",
    ],
    dont: [
      "Don’t set a fixed height on the viewport itself — size the MessageScroller frame and let the viewport fill it.",
      "Don’t reuse messageId values across rows.",
    ],
  },
  related: ["message", "bubble", "scroll-area"],
};
