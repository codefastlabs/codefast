import { docSource, docUsage } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { MessageScrollerAnchoring } from "#/registry/message-scroller/anchoring.example";
import { MessageScrollerAnimation } from "#/registry/message-scroller/animation.example";
import { MessageScrollerCommands } from "#/registry/message-scroller/commands.example";
import { MessageScrollerGroupChat } from "#/registry/message-scroller/group-chat.example";
import { MessageScrollerLoadHistory } from "#/registry/message-scroller/load-history.example";
import { MessageScrollerOpeningPosition } from "#/registry/message-scroller/opening-position.example";
import { MessageScrollerPreviousContext } from "#/registry/message-scroller/previous-context.example";
import { MessageScrollerScrollable } from "#/registry/message-scroller/scrollable.example";
import { MessageScrollerStreaming } from "#/registry/message-scroller/streaming.example";
import { MessageScrollerVisibility } from "#/registry/message-scroller/visibility.example";

export const messageScrollerDoc: ComponentDoc = {
  usage: docUsage("message-scroller"),
  examples: [
    {
      id: "message-scroller-streaming",
      title: "Streaming messages",
      description:
        "autoScroll pins the viewport to the live edge as replies arrive, and MessageScrollerButton offers a way back once the reader scrolls up.",
      Demo: MessageScrollerStreaming,
      source: docSource("message-scroller", "streaming"),
      previewClassName: "block",
    },
    {
      id: "message-scroller-anchoring",
      title: "Anchoring turns",
      description:
        "scrollAnchor marks which role settles near the top edge — toggle between user and assistant to compare where each new turn lands.",
      Demo: MessageScrollerAnchoring,
      source: docSource("message-scroller", "anchoring"),
      previewClassName: "block",
    },
    {
      id: "message-scroller-previous-context",
      title: "Keeping context visible",
      description:
        "scrollPreviousItemPeek leaves a slice of the previous reply above a newly anchored turn — adjust the peek and send to see it change.",
      Demo: MessageScrollerPreviousContext,
      source: docSource("message-scroller", "previous-context"),
      previewClassName: "block",
    },
    {
      id: "message-scroller-opening-position",
      title: "Opening position",
      description:
        "defaultScrollPosition decides where a saved transcript opens — start, end, or the last anchored turn.",
      Demo: MessageScrollerOpeningPosition,
      source: docSource("message-scroller", "opening-position"),
      previewClassName: "block",
    },
    {
      id: "message-scroller-load-history",
      title: "Load history",
      description:
        "preserveScrollOnPrepend keeps the first visible row stable when earlier messages are prepended, so loading history never yanks the reader.",
      Demo: MessageScrollerLoadHistory,
      source: docSource("message-scroller", "load-history"),
      previewClassName: "block",
    },
    {
      id: "message-scroller-group-chat",
      title: "Group chat",
      description:
        "Mix Message rows and Marker events in one transcript; a marker with scrollAnchor becomes the next turn boundary when a participant joins.",
      Demo: MessageScrollerGroupChat,
      source: docSource("message-scroller", "group-chat"),
      previewClassName: "block",
    },
    {
      id: "message-scroller-animation",
      title: "Animation",
      description:
        "Animate the entrance of user turns with transform and opacity presets while keeping the measured row predictable for anchoring.",
      Demo: MessageScrollerAnimation,
      source: docSource("message-scroller", "animation"),
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
    {
      id: "message-scroller-commands",
      title: "Imperative commands",
      description:
        "useMessageScroller() exposes scrollToMessage/scrollToEnd/scrollToStart — here a 'Jump to' menu drives the transcript from outside.",
      Demo: MessageScrollerCommands,
      source: docSource("message-scroller", "commands"),
      previewClassName: "block",
    },
    {
      id: "message-scroller-visibility",
      title: "Visibility outline",
      description:
        "useMessageScrollerVisibility surfaces the current anchored turn — this outline highlights and jumps to it as the reader scrolls.",
      Demo: MessageScrollerVisibility,
      source: docSource("message-scroller", "visibility"),
      previewClassName: "block",
    },
  ],
  anatomy: [
    {
      name: "MessageScrollerProvider",
      children: [
        {
          name: "MessageScroller",
          children: [
            {
              name: "MessageScrollerViewport",
              children: [{ name: "MessageScrollerContent", children: [{ name: "MessageScrollerItem" }] }],
            },
            { name: "MessageScrollerButton" },
          ],
        },
      ],
    },
  ],
  features: [
    "autoScroll follows new content at the bottom only while the reader is already there — any deliberate scroll or wheel input releases follow-bottom so they're never yanked back down.",
    'scrollAnchor on a MessageScrollerItem marks a turn boundary that streaming or appended content anchors against, and that defaultScrollPosition="last-anchor" restores to.',
    "preserveScrollOnPrepend (default true) keeps the first visible row stable when older history is prepended above it.",
    "Exposes imperative commands (useMessageScroller()) and live state hooks (useMessageScrollerScrollable, useMessageScrollerVisibility) for building custom jump-to or outline UIs.",
  ],
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
