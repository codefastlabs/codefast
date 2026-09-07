import { docSource, docUsage } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { SelectAlignItem } from "#/registry/select/align-item.example";
import { SelectDisabled } from "#/registry/select/disabled.example";
import { SelectGroups } from "#/registry/select/groups.example";
import { SelectInvalid } from "#/registry/select/invalid.example";
import { SelectRtl } from "#/registry/select/rtl.example";
import { SelectScrollable } from "#/registry/select/scrollable.example";

export const selectDoc: ComponentDoc = {
  usage: docUsage("select"),
  examples: [
    {
      id: "select-align-item",
      title: "Align Item With Trigger",
      description:
        "Use the position prop on SelectContent to control alignment. When position='item-aligned' (default), the popup positions so the selected item appears over the trigger. When position='popper', the popup aligns to the trigger edge.",
      Demo: SelectAlignItem,
      source: docSource("select", "align-item"),
    },
    {
      id: "select-disabled",
      title: "Disabled",
      description: "Displays a list of options for the user to pick from—triggered by a button.",
      Demo: SelectDisabled,
      source: docSource("select", "disabled"),
    },
    {
      id: "select-groups",
      title: "Groups",
      description: "Use SelectGroup, SelectLabel, and SelectSeparator to organize items.",
      Demo: SelectGroups,
      source: docSource("select", "groups"),
    },
    {
      id: "select-invalid",
      title: "Invalid",
      description: "Set data-invalid on the Field and aria-invalid on the SelectTrigger to show an error state.",
      Demo: SelectInvalid,
      source: docSource("select", "invalid"),
    },
    {
      id: "select-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: SelectRtl,
      source: docSource("select", "rtl"),
      direction: "rtl",
    },
    {
      id: "select-scrollable",
      title: "Scrollable",
      description: "A select with many items that scrolls.",
      Demo: SelectScrollable,
      source: docSource("select", "scrollable"),
    },
  ],
  anatomy: [
    {
      name: "Select",
      children: [
        { name: "SelectTrigger", children: [{ name: "SelectValue" }] },
        {
          name: "SelectContent",
          children: [{ name: "SelectGroup", children: [{ name: "SelectLabel" }, { name: "SelectItem" }] }],
        },
      ],
    },
  ],
  features: [
    "ARIA listbox with type-ahead — start typing to jump to a matching option.",
    'position="item-aligned" (default) opens with the selected item over the trigger; position="popper" anchors to the trigger edge instead.',
    "Two trigger sizes (default, sm) and built-in scroll-up/down buttons for long lists.",
    "SelectGroup/SelectLabel/SelectSeparator organize options into announced groups.",
  ],
  api: [
    {
      name: "Select",
      description: "Root. Owns the selected value.",
      props: [
        {
          name: "value",
          type: "string",
          description: "The controlled selected value.",
        },
        {
          name: "defaultValue",
          type: "string",
          description: "The selected value when initially rendered (uncontrolled).",
        },
        {
          name: "onValueChange",
          type: "(value: string) => void",
          description: "Called when the selected value changes.",
        },
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description: "Disables the whole control.",
        },
      ],
    },
    {
      name: "SelectGroup",
      description: "Wraps related options so screen readers announce the group, not just visual spacing.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "A SelectLabel followed by the group's SelectItems.",
        },
      ],
    },
    {
      name: "SelectLabel",
      description: "Heading text for a SelectGroup.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "Heading text for the group (required inside SelectGroup for accessibility).",
        },
      ],
    },
    {
      name: "SelectItem",
      props: [
        {
          name: "value",
          type: "string",
          description: "The value submitted when this item is chosen (required).",
        },
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description: "Makes a single option non-selectable.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Space"], description: "Opens the menu when the trigger is focused." },
      { keys: ["Arrow", "Down"], description: "Moves to the next option." },
      { keys: ["Arrow", "Up"], description: "Moves to the previous option." },
      { keys: ["Enter"], description: "Selects the highlighted option." },
      { keys: ["Esc"], description: "Closes without changing the value." },
    ],
    notes: [
      "Implements the ARIA listbox pattern with type-ahead — start typing to jump to an option.",
      "Use SelectLabel inside a SelectGroup so groups are announced, not just visually separated.",
      "For native mobile behaviour with zero JS, prefer Native Select.",
    ],
  },
  guidelines: {
    do: [
      "Always set a placeholder via SelectValue for empty state.",
      "Group and label options once a list grows past ~7 items.",
    ],
    dont: [
      "Don’t use Select for boolean choices — use a Switch or Checkbox.",
      "Don’t put interactive controls other than options inside the menu.",
    ],
  },
  related: ["native-select", "dropdown-menu", "radio-group"],
};
