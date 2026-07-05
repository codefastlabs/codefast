import { docSource, docUsage } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
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

export const itemDoc: ComponentDoc = {
  usage: docUsage("item"),
  examples: [
    {
      id: "item-avatar",
      title: "Avatar",
      description: "Put a real Avatar (or a stack of them) inside ItemMedia — there's no dedicated avatar variant.",
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
  features: [
    "Three visual variants (default, muted, outline) and three sizes (default, sm, xs).",
    "ItemMedia has icon and image variants with matching size scaling — wrap a real Avatar inside for an avatar row instead of a dedicated variant.",
    "asChild renders the whole Item as its child (e.g. a link) so hover/focus states apply to the real interactive element.",
  ],
  api: [
    {
      name: "Item",
      description: "A single row; can render as a real interactive element via asChild.",
      props: [
        {
          name: "variant",
          type: '"default" | "muted" | "outline"',
          default: '"default"',
          description: "Visual style of the row.",
        },
        {
          name: "size",
          type: '"default" | "sm" | "xs"',
          default: '"default"',
          description: "Row density.",
        },
        {
          name: "asChild",
          type: "boolean",
          default: "false",
          description: "Render as its child (e.g. an anchor) instead of a div.",
        },
        {
          name: "children",
          type: "ReactNode",
          description: "Compose ItemMedia, ItemContent, and ItemActions inside an Item.",
        },
      ],
    },
    {
      name: "ItemGroup",
      description: "Layout container that stacks Item rows with role='list'.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "One or more Item rows.",
        },
      ],
    },
    {
      name: "ItemMedia",
      description: "Leading visual slot — an icon, image, or a real Avatar.",
      props: [
        {
          name: "variant",
          type: '"default" | "icon" | "image"',
          default: '"default"',
          description: "Sizes and scales the media to match icon or image content.",
        },
        {
          name: "children",
          type: "ReactNode",
          description: "An icon, image, or Avatar element.",
        },
      ],
    },
    {
      name: "ItemContent",
      description: "Flexible column holding the title and description.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "ItemTitle and ItemDescription.",
        },
      ],
    },
    {
      name: "ItemTitle",
      description: "The row's primary label.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "Title text, truncated to a single line.",
        },
      ],
    },
    {
      name: "ItemDescription",
      description: "Secondary text below the title.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "Supporting text, clamped to two lines.",
        },
      ],
    },
    {
      name: "ItemActions",
      description: "Trailing slot for controls such as buttons or a dropdown trigger.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "One or more action elements.",
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
