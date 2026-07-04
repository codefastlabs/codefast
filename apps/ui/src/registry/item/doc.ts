import { ItemAvatar } from "#/registry/item/avatar.example";
import { ItemDropdown } from "#/registry/item/dropdown.example";
import { ItemGroupExample } from "#/registry/item/group.example";
import { ItemHeaderDemo } from "#/registry/item/header.example";
import { ItemIcon } from "#/registry/item/icon.example";
import { ItemImage } from "#/registry/item/image.example";
import { ItemLink } from "#/registry/item/link.example";
import { ItemRtl } from "#/registry/item/rtl.example";
import { ItemSizeDemo } from "#/registry/item/size.example";
import { ItemVariant } from "#/registry/item/variant.example";
import { docSource } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const itemDoc: ComponentDoc = {
  examples: [
    {
      id: "item-avatar",
      title: "Avatar",
      description: "You can use ItemMedia with variant='avatar' to display an avatar.",
      Demo: ItemAvatar,
      source: docSource("item", "avatar"),
    },
    {
      id: "item-dropdown",
      title: "Dropdown",
      description: "A versatile component for displaying content with media, title, description, and actions.",
      Demo: ItemDropdown,
      source: docSource("item", "dropdown"),
    },
    {
      id: "item-group",
      title: "Group",
      description: "Use ItemGroup to group related items together.",
      Demo: ItemGroupExample,
      source: docSource("item", "group"),
    },
    {
      id: "item-header",
      title: "Header",
      description: "Use ItemHeader to add a header above the item content.",
      Demo: ItemHeaderDemo,
      source: docSource("item", "header"),
    },
    {
      id: "item-icon",
      title: "Icon",
      description: "Use ItemMedia with variant='icon' to display an icon.",
      Demo: ItemIcon,
      source: docSource("item", "icon"),
    },
    {
      id: "item-image",
      title: "Image",
      description: "Use ItemMedia with variant='image' to display an image.",
      Demo: ItemImage,
      source: docSource("item", "image"),
    },
    {
      id: "item-link",
      title: "Link",
      description:
        "Use the asChild prop to render the item as a link. The hover and focus states will be applied to the anchor element.",
      Demo: ItemLink,
      source: docSource("item", "link"),
    },
    {
      id: "item-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: ItemRtl,
      source: docSource("item", "rtl"),
      direction: "rtl",
    },
    {
      id: "item-size",
      title: "Size",
      description: "Use the size prop to change the size of the item.",
      Demo: ItemSizeDemo,
      source: docSource("item", "size"),
    },
    {
      id: "item-variant",
      title: "Variant",
      description: "Use the variant prop to change the visual style of the item.",
      Demo: ItemVariant,
      source: docSource("item", "variant"),
    },
  ],
  anatomy: [
    {
      name: "ItemGroup",
      children: [
        {
          name: "Item",
          children: [
            { name: "ItemMedia" },
            { name: "ItemContent", children: [{ name: "ItemTitle" }, { name: "ItemDescription" }] },
            { name: "ItemActions" },
          ],
        },
      ],
    },
  ],
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
    do: ["Use for settings lists, inboxes, and search results.", "Keep one primary action per row."],
    dont: ["Don’t nest multiple competing actions in a row.", "Don’t use Item where a Table’s columns fit better."],
  },
  related: ["card", "table", "separator"],
};
