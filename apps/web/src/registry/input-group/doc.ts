import { InputGroupAddons } from "#/registry/input-group/addons.example";
import { InputGroupCopy } from "#/registry/input-group/copy.example";
import { InputGroupValidation } from "#/registry/input-group/validation.example";
import { docSource, docAnatomy } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const inputGroupDoc: ComponentDoc = {
  examples: [
    {
      id: "addons",
      title: "Leading & trailing addons",
      description: "Prefix text, a leading icon, or a trailing button — all share one focus ring.",
      Demo: InputGroupAddons,
      source: docSource("input-group", "addons"),
      previewClassName: "items-start",
    },
    {
      id: "copy",
      title: "Copy button",
      description: "Pair a read-only value with a trailing action button.",
      Demo: InputGroupCopy,
      source: docSource("input-group", "copy"),
      previewClassName: "items-start",
    },
    {
      id: "validation",
      title: "Status & prefix",
      description: "Show a validation icon, or a fixed prefix addon.",
      Demo: InputGroupValidation,
      source: docSource("input-group", "validation"),
      previewClassName: "items-start",
    },
  ],
  anatomy: docAnatomy("input-group"),
  api: [
    {
      name: "InputGroup / InputGroupInput",
      description: "A wrapper that frames the input with addons.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "An InputGroupInput plus one or more InputGroupAddon.",
        },
      ],
    },
    {
      name: "InputGroupAddon",
      props: [
        {
          name: "align",
          type: '"inline-start" | "inline-end" | "block-start" | …',
          description: "Where the addon sits relative to the input.",
        },
      ],
    },
    {
      name: "InputGroupText / InputGroupButton",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "A static label (e.g. https://) or an interactive button.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "The whole group shows one focus ring, but the input is the focusable element.",
      "Label the input with a Label or aria-label; addons are not the field’s name.",
      "Give icon-only addon buttons an aria-label.",
    ],
  },
  guidelines: {
    do: ["Use for units, prefixes, and inline actions tied to a field.", "Keep addons short and scannable."],
    dont: ["Don’t overload a field with many addons.", "Don’t hide the field’s real label."],
  },
  related: ["input", "input-password", "input-search"],
};
