import { InputGroupBasic } from "#/registry/input-group/basic.example";
import { InputGroupBlockEnd } from "#/registry/input-group/block-end.example";
import { InputGroupBlockStart } from "#/registry/input-group/block-start.example";
import { InputGroupButtonGroup } from "#/registry/input-group/button-group.example";
import { InputGroupButtonExample } from "#/registry/input-group/button.example";
import { InputGroupCustom } from "#/registry/input-group/custom.example";
import { InputGroupDropdown } from "#/registry/input-group/dropdown.example";
import { InputGroupIcon } from "#/registry/input-group/icon.example";
import { InputGroupInCard } from "#/registry/input-group/in-card.example";
import { InputGroupInlineEnd } from "#/registry/input-group/inline-end.example";
import { InputGroupInlineStart } from "#/registry/input-group/inline-start.example";
import { InputGroupKbd } from "#/registry/input-group/kbd.example";
import { InputGroupLabel } from "#/registry/input-group/label.example";
import { InputGroupRtl } from "#/registry/input-group/rtl.example";
import { InputGroupSpinner } from "#/registry/input-group/spinner.example";
import { InputGroupTextExample } from "#/registry/input-group/text.example";
import { InputGroupTextareaExamples } from "#/registry/input-group/textarea-examples.example";
import { InputGroupTextareaExample } from "#/registry/input-group/textarea.example";
import { InputGroupTooltip } from "#/registry/input-group/tooltip.example";
import { InputGroupWithAddons } from "#/registry/input-group/with-addons.example";
import { InputGroupWithButtons } from "#/registry/input-group/with-buttons.example";
import { InputGroupWithKbd } from "#/registry/input-group/with-kbd.example";
import { InputGroupWithTooltip } from "#/registry/input-group/with-tooltip.example";
import { docSource } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const inputGroupDoc: ComponentDoc = {
  examples: [
    {
      id: "input-group-basic",
      title: "Basic",
      description: "Input fields wrapped in an InputGroup, composed with Field for labels and disabled states.",
      Demo: InputGroupBasic,
      source: docSource("input-group", "basic"),
    },
    {
      id: "input-group-block-end",
      title: "block-end",
      description: "Use align='block-end' to position the addon below the input.",
      Demo: InputGroupBlockEnd,
      source: docSource("input-group", "block-end"),
    },
    {
      id: "input-group-block-start",
      title: "block-start",
      description: "Use align='block-start' to position the addon above the input.",
      Demo: InputGroupBlockStart,
      source: docSource("input-group", "block-start"),
    },
    {
      id: "input-group-button",
      title: "Button",
      description: "Add addons, buttons, and helper content to inputs.",
      Demo: InputGroupButtonExample,
      source: docSource("input-group", "button"),
    },
    {
      id: "input-group-button-group",
      title: "With Button Group",
      description: "Compose an InputGroup with ButtonGroup for prefix text and addons.",
      Demo: InputGroupButtonGroup,
      source: docSource("input-group", "button-group"),
    },
    {
      id: "input-group-custom",
      title: "Custom Input",
      description: "Here's an example of a custom resizable textarea from a third-party library.",
      Demo: InputGroupCustom,
      source: docSource("input-group", "custom"),
    },
    {
      id: "input-group-dropdown",
      title: "Dropdown",
      description: "Add addons, buttons, and helper content to inputs.",
      Demo: InputGroupDropdown,
      source: docSource("input-group", "dropdown"),
    },
    {
      id: "input-group-icon",
      title: "Icon",
      description: "Add addons, buttons, and helper content to inputs.",
      Demo: InputGroupIcon,
      source: docSource("input-group", "icon"),
    },
    {
      id: "input-group-in-card",
      title: "In Card",
      description: "Use input groups inside a Card form with fields, addons and a textarea.",
      Demo: InputGroupInCard,
      source: docSource("input-group", "in-card"),
    },
    {
      id: "input-group-inline-end",
      title: "inline-end",
      description: "Use align='inline-end' to position the addon at the end of the input.",
      Demo: InputGroupInlineEnd,
      source: docSource("input-group", "inline-end"),
    },
    {
      id: "input-group-inline-start",
      title: "inline-start",
      description: "Use align='inline-start' to position the addon at the start of the input. This is the default.",
      Demo: InputGroupInlineStart,
      source: docSource("input-group", "inline-start"),
    },
    {
      id: "input-group-kbd",
      title: "Kbd",
      description: "Add addons, buttons, and helper content to inputs.",
      Demo: InputGroupKbd,
      source: docSource("input-group", "kbd"),
    },
    {
      id: "input-group-label",
      title: "With Label",
      description: "Add a Label inside an InputGroupAddon to title the input.",
      Demo: InputGroupLabel,
      source: docSource("input-group", "label"),
    },
    {
      id: "input-group-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: InputGroupRtl,
      source: docSource("input-group", "rtl"),
      direction: "rtl",
    },
    {
      id: "input-group-spinner",
      title: "Spinner",
      description: "Add addons, buttons, and helper content to inputs.",
      Demo: InputGroupSpinner,
      source: docSource("input-group", "spinner"),
    },
    {
      id: "input-group-text",
      title: "Text",
      description: "Add addons, buttons, and helper content to inputs.",
      Demo: InputGroupTextExample,
      source: docSource("input-group", "text"),
    },
    {
      id: "input-group-textarea",
      title: "Textarea",
      description: "Add addons, buttons, and helper content to inputs.",
      Demo: InputGroupTextareaExample,
      source: docSource("input-group", "textarea"),
    },
    {
      id: "input-group-textarea-examples",
      title: "Textarea Variations",
      description: "More InputGroupTextarea compositions with toolbars, labels and actions.",
      Demo: InputGroupTextareaExamples,
      source: docSource("input-group", "textarea-examples"),
    },
    {
      id: "input-group-tooltip",
      title: "With Tooltip",
      description: "Show contextual help on input group buttons with Tooltip.",
      Demo: InputGroupTooltip,
      source: docSource("input-group", "tooltip"),
    },
    {
      id: "input-group-with-addons",
      title: "Addons",
      description: "Inline icons, text and buttons as input group addons.",
      Demo: InputGroupWithAddons,
      source: docSource("input-group", "with-addons"),
    },
    {
      id: "input-group-with-buttons",
      title: "Buttons",
      description: "Attach action buttons to an input with InputGroupButton.",
      Demo: InputGroupWithButtons,
      source: docSource("input-group", "with-buttons"),
    },
    {
      id: "input-group-with-kbd",
      title: "With Kbd",
      description: "Show keyboard shortcuts inside an input group with Kbd.",
      Demo: InputGroupWithKbd,
      source: docSource("input-group", "with-kbd"),
    },
    {
      id: "input-group-with-tooltip",
      title: "Tooltip and Popover",
      description: "Combine input groups with tooltips, popovers and dropdown menus.",
      Demo: InputGroupWithTooltip,
      source: docSource("input-group", "with-tooltip"),
    },
  ],
  anatomy: [{ name: "InputGroup", children: [{ name: "InputGroupAddon" }, { name: "InputGroupInput" }] }],
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
