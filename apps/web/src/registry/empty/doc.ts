import { EmptyAvatarGroup } from "#/registry/empty/avatar-group.example";
import { EmptyAvatar } from "#/registry/empty/avatar.example";
import { EmptyMuted } from "#/registry/empty/background.example";
import { EmptyInCard } from "#/registry/empty/card.example";
import { EmptyInputGroup } from "#/registry/empty/input-group.example";
import { EmptyOutline } from "#/registry/empty/outline.example";
import { EmptyRtl } from "#/registry/empty/rtl.example";
import { docSource, docAnatomy } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const emptyDoc: ComponentDoc = {
  examples: [
    {
      id: "empty-avatar",
      title: "Avatar",
      description: "Use the EmptyMedia component to display an avatar in the empty state.",
      Demo: EmptyAvatar,
      source: docSource("empty", "avatar"),
    },
    {
      id: "empty-avatar-group",
      title: "Avatar Group",
      description: "Use the EmptyMedia component to display an avatar group in the empty state.",
      Demo: EmptyAvatarGroup,
      source: docSource("empty", "avatar-group"),
    },
    {
      id: "empty-background",
      title: "Background",
      description: "Use the bg-* and bg-gradient-* utilities to add a background to the empty state.",
      Demo: EmptyMuted,
      source: docSource("empty", "background"),
    },
    {
      id: "empty-card",
      title: "Card",
      description: "Wrap the Empty component in a Card to create an empty-state card.",
      Demo: EmptyInCard,
      source: docSource("empty", "card"),
    },
    {
      id: "empty-input-group",
      title: "InputGroup",
      description: "You can add an InputGroup component to the EmptyContent component.",
      Demo: EmptyInputGroup,
      source: docSource("empty", "input-group"),
    },
    {
      id: "empty-outline",
      title: "Outline",
      description: "Use the border utility class to create an outline empty state.",
      Demo: EmptyOutline,
      source: docSource("empty", "outline"),
    },
    {
      id: "empty-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: EmptyRtl,
      source: docSource("empty", "rtl"),
      direction: "rtl",
    },
  ],
  anatomy: docAnatomy("empty"),
  api: [
    {
      name: "Empty",
      description: "Layout wrapper for an empty/zero state.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "Compose EmptyHeader (media, title, description) and EmptyContent (action).",
        },
      ],
    },
    {
      name: "EmptyMedia / EmptyTitle / EmptyDescription / EmptyContent",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "The icon/illustration, headline, supporting text, and action slot.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "Use a real heading for EmptyTitle so it fits the document outline.",
      "Always give users a next step — a button or link out of the empty state.",
      "Keep the icon decorative; the meaning lives in the title and description.",
    ],
  },
  guidelines: {
    do: ["Explain why it’s empty and what to do next.", "Offer a single, primary action."],
    dont: ["Don’t leave a blank area with no guidance.", "Don’t pile on multiple competing actions."],
  },
  related: ["card", "item", "button"],
};
