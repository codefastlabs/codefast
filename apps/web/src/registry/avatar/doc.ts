import { AvatarFallbackExample } from "#/registry/avatar/fallback.example";
import { AvatarGroupExample } from "#/registry/avatar/group.example";
import { AvatarSizes } from "#/registry/avatar/sizes.example";
import { docSource, docAnatomy } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const avatarDoc: ComponentDoc = {
  examples: [
    {
      id: "image-fallback",
      title: "Image, fallback & badge",
      description: "Show a photo, fall back to initials when it fails, and add a status badge.",
      Demo: AvatarFallbackExample,
      source: docSource("avatar", "fallback"),
    },
    {
      id: "group",
      title: "Stacked group",
      description: "Overlap avatars with AvatarGroup and cap the overflow with a count.",
      Demo: AvatarGroupExample,
      source: docSource("avatar", "group"),
    },
    {
      id: "sizes",
      title: "Sizes",
      description: "From xs to lg through the size prop.",
      Demo: AvatarSizes,
      source: docSource("avatar", "sizes"),
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
