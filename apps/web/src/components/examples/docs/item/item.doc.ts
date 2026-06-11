import { ItemCompact } from "#/components/examples/docs/item/compact";
import { ItemList } from "#/components/examples/docs/item/list";
import { ItemNotifications } from "#/components/examples/docs/item/notifications";
import { docSource, docAnatomy } from "#/components/examples/docs/source";
import type { ComponentDoc } from "#/components/examples/docs/types";

export const itemDoc: ComponentDoc = {
  examples: [
    {
      id: "list",
      title: "List rows",
      description: "Compose media, title, description, and actions into a divided list.",
      Demo: ItemList,
      code: docSource("item", "list"),
      previewClassName: "items-start",
    },
    {
      id: "compact",
      title: "Single-line rows",
      description: "Drop the description for a dense file or option list.",
      Demo: ItemCompact,
      code: docSource("item", "compact"),
      previewClassName: "items-start",
    },
    {
      id: "notifications",
      title: "With trailing badge",
      description: "Surface unread state with a Badge in the actions slot.",
      Demo: ItemNotifications,
      code: docSource("item", "notifications"),
      previewClassName: "items-start",
    },
  ],
  anatomy: docAnatomy("item"),
  api: [
    {
      name: "Item / ItemGroup",
      description: "A row layout and the container that stacks rows.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "Compose ItemMedia, ItemContent, and ItemActions inside an Item.",
        },
      ],
    },
    {
      name: "ItemMedia / ItemContent / ItemTitle / ItemDescription / ItemActions",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "Leading media, the title + description block, and trailing actions.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "Item is presentational — give actions real buttons/links with labels.",
      "Use ItemSeparator between rows; it’s decorative for assistive tech.",
      "If a whole row is clickable, wrap it in one link rather than nesting interactives.",
    ],
  },
  guidelines: {
    do: [
      "Use for settings lists, inboxes, and search results.",
      "Keep one primary action per row.",
    ],
    dont: [
      "Don’t nest multiple competing actions in a row.",
      "Don’t use Item where a Table’s columns fit better.",
    ],
  },
  related: ["card", "table", "separator"],
};
