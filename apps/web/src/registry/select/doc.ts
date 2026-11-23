import { docSource, docUsage } from "#registry/_core/source";
import type { ComponentDoc } from "#registry/_core/types";
import { SelectAlignItem } from "#registry/select/align-item.example";
import { SelectDisabled } from "#registry/select/disabled.example";
import { SelectGroups } from "#registry/select/groups.example";
import { SelectInvalid } from "#registry/select/invalid.example";
import { SelectRtl } from "#registry/select/rtl.example";
import { SelectScrollable } from "#registry/select/scrollable.example";

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
          children: [
            { name: "SelectGroup", children: [{ name: "SelectLabel" }, { name: "SelectItem" }] },
            { name: "SelectSeparator" },
          ],
        },
      ],
    },
  ],
  features: [
    "ARIA listbox with type-ahead — start typing to jump to a matching option.",
    'position="item-aligned" (default) opens with the selected item over the trigger; position="popper" anchors to the trigger edge instead.',
    "Two trigger sizes (default, sm) and built-in scroll-up/down buttons for long lists.",
    "SelectGroup/SelectLabel/SelectSeparator organize options into announced groups.",
    "Controlled or uncontrolled for both the value and the open state; with name it submits with a form like a native select.",
  ],
  api: [
    {
      name: "Select",
      description: "Root. Owns the selected value and the open state; renders no element of its own.",
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
          name: "open",
          type: "boolean",
          description: "The controlled open state of the list.",
        },
        {
          name: "defaultOpen",
          type: "boolean",
          default: "false",
          description: "The open state when initially rendered (uncontrolled).",
        },
        {
          name: "onOpenChange",
          type: "(open: boolean) => void",
          description: "Called when the list opens or closes.",
        },
        {
          name: "name",
          type: "string",
          description: "Submits the value under this name with the surrounding form.",
        },
        {
          name: "required",
          type: "boolean",
          default: "false",
          description: "Blocks form submission until a value is picked.",
        },
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description: "Disables the whole control.",
        },
        {
          name: "dir",
          type: '"ltr" | "rtl"',
          description: "Reading direction; inherits from DirectionProvider when unset.",
        },
      ],
    },
    {
      name: "SelectTrigger",
      description: "The button that shows the value and opens the list. Renders the chevron itself.",
      props: [
        {
          name: "size",
          type: '"default" | "sm"',
          default: '"default"',
          description: "Trigger height, mirrored to data-size.",
        },
        {
          name: "aria-invalid",
          type: "boolean",
          description: "Shows the error state; pair it with data-invalid on the Field and a FieldError.",
        },
      ],
    },
    {
      name: "SelectValue",
      description: "The selected option's text inside the trigger, or the placeholder.",
      props: [
        {
          name: "placeholder",
          type: "ReactNode",
          description: "Shown until a value is picked.",
        },
      ],
    },
    {
      name: "SelectContent",
      description: "The list, rendered in a portal with its scroll buttons.",
      props: [
        {
          name: "position",
          type: '"item-aligned" | "popper"',
          default: '"item-aligned"',
          description:
            "item-aligned puts the selected item over the trigger; popper anchors the list to the trigger edge.",
        },
        {
          name: "side",
          type: '"top" | "right" | "bottom" | "left"',
          default: '"bottom"',
          description: 'The preferred edge of the trigger to render against, with position="popper".',
        },
        {
          name: "sideOffset",
          type: "number",
          default: "0",
          description: 'Distance from the trigger in pixels, with position="popper".',
        },
        {
          name: "align",
          type: '"start" | "center" | "end"',
          default: '"center"',
          description: 'The preferred alignment against the trigger, with position="popper".',
        },
        {
          name: "onEscapeKeyDown",
          type: "(event: KeyboardEvent) => void",
          description: "Called on Escape; call preventDefault to keep the list open.",
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
      description: "One option. Renders the check for the selected item itself.",
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
          description: "Makes a single option non-selectable; the keyboard skips it.",
        },
        {
          name: "textValue",
          type: "string",
          description: "Text for type-ahead when the item's children are not plain text.",
        },
      ],
    },
    {
      name: "SelectSeparator",
      description: "A rule between groups, hidden from assistive technology.",
      props: [
        {
          name: "className",
          type: "string",
          description: "Merged after the default classes.",
        },
      ],
    },
    {
      name: "SelectScrollUpButton",
      description: "Rendered by SelectContent at the top of a long list; import it only to build your own content.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "Replaces the chevron icon.",
        },
      ],
    },
    {
      name: "SelectScrollDownButton",
      description: "Rendered by SelectContent at the bottom of a long list; import it only to build your own content.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "Replaces the chevron icon.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Space"], description: "Opens the menu when the trigger is focused." },
      { keys: ["Enter"], description: "Opens the menu from the trigger, or selects the highlighted option." },
      { keys: ["Arrow", "Down"], description: "Opens the menu from the trigger, or moves to the next option." },
      { keys: ["Arrow", "Up"], description: "Opens the menu from the trigger, or moves to the previous option." },
      { keys: ["Home"], description: "Moves to the first option." },
      { keys: ["End"], description: "Moves to the last option." },
      { keys: ["Esc"], description: "Closes without changing the value and returns focus to the trigger." },
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
