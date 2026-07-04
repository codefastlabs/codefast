import { AvatarBadgeIconExample } from "#/registry/avatar/badge-icon.example";
import { AvatarWithBadge } from "#/registry/avatar/badge.example";
import { AvatarBasic } from "#/registry/avatar/basic.example";
import { AvatarDemo } from "#/registry/avatar/demo.example";
import { AvatarDropdown } from "#/registry/avatar/dropdown.example";
import { AvatarGroupCountIconExample } from "#/registry/avatar/group-count-icon.example";
import { AvatarGroupCountExample } from "#/registry/avatar/group-count.example";
import { AvatarGroupExample } from "#/registry/avatar/group.example";
import { AvatarRtl } from "#/registry/avatar/rtl.example";
import { AvatarSizeExample } from "#/registry/avatar/size.example";
import { docSource, docAnatomy } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const avatarDoc: ComponentDoc = {
  examples: [
    {
      id: "avatar-demo",
      title: "Overview",
      description: "A single, a badged, and a stacked group avatar side by side.",
      Demo: AvatarDemo,
      source: docSource("avatar", "demo"),
      previewClassName: "block",
    },
    {
      id: "group",
      title: "Stacked group",
      description: "Overlap avatars with AvatarGroup and cap the overflow with a count.",
      Demo: AvatarGroupExample,
      source: docSource("avatar", "group"),
    },
    {
      id: "avatar-badge",
      title: "Badge",
      description:
        "Use the AvatarBadge component to add a badge to the avatar. The badge is positioned at the bottom right of the avatar.",
      Demo: AvatarWithBadge,
      source: docSource("avatar", "badge"),
    },
    {
      id: "avatar-badge-icon",
      title: "Badge with Icon",
      description: "You can also use an icon inside <AvatarBadge>.",
      Demo: AvatarBadgeIconExample,
      source: docSource("avatar", "badge-icon"),
    },
    {
      id: "avatar-basic",
      title: "Basic",
      description: "A basic avatar component with an image and a fallback.",
      Demo: AvatarBasic,
      source: docSource("avatar", "basic"),
    },
    {
      id: "avatar-dropdown",
      title: "Dropdown",
      description: "You can use the Avatar component as a trigger for a dropdown menu.",
      Demo: AvatarDropdown,
      source: docSource("avatar", "dropdown"),
    },
    {
      id: "avatar-group-count",
      title: "Avatar Group Count",
      description: "Use <AvatarGroupCount> to add a count to the group.",
      Demo: AvatarGroupCountExample,
      source: docSource("avatar", "group-count"),
    },
    {
      id: "avatar-group-count-icon",
      title: "Avatar Group with Icon",
      description: "You can also use an icon inside <AvatarGroupCount>.",
      Demo: AvatarGroupCountIconExample,
      source: docSource("avatar", "group-count-icon"),
    },
    {
      id: "avatar-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: AvatarRtl,
      source: docSource("avatar", "rtl"),
      direction: "rtl",
    },
    {
      id: "avatar-size",
      title: "Sizes",
      description: "Use the size prop to change the size of the avatar.",
      Demo: AvatarSizeExample,
      source: docSource("avatar", "size"),
    },
  ],
  anatomy: docAnatomy("avatar"),
  api: [
    {
      name: "Avatar",
      props: [
        {
          name: "size",
          type: '"sm" | "default" | "lg"',
          default: '"default"',
          description: "Diameter of the avatar.",
        },
      ],
    },
    {
      name: "AvatarImage / AvatarFallback",
      description: "The image and the initials shown until (or unless) the image loads.",
      props: [
        {
          name: "src / alt",
          type: "string",
          description: "On AvatarImage. AvatarFallback renders when the image is missing.",
        },
      ],
    },
    {
      name: "AvatarGroup / AvatarGroupCount",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "Wrap avatars to overlap them; AvatarGroupCount shows the remainder.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "Always set a meaningful alt on AvatarImage; use the person’s name.",
      "AvatarFallback initials are decorative — the name should still exist in alt or nearby text.",
      "The status badge is decorative; convey the same status in text where it matters.",
    ],
  },
  guidelines: {
    do: [
      "Provide initials as a fallback for every avatar.",
      "Cap stacked groups with a +N count rather than showing dozens.",
    ],
    dont: [
      "Don’t rely on the avatar image alone to identify a user.",
      "Don’t use colour-only badges to convey critical status.",
    ],
  },
  related: ["badge", "item", "skeleton"],
};
