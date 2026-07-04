import { ButtonGroupDropdown } from "#/registry/button-group/dropdown.example";
import { ButtonGroupInputGroup } from "#/registry/button-group/input-group.example";
import { ButtonGroupInput } from "#/registry/button-group/input.example";
import { ButtonGroupNested } from "#/registry/button-group/nested.example";
import { ButtonGroupOrientation } from "#/registry/button-group/orientation.example";
import { ButtonGroupPopover } from "#/registry/button-group/popover.example";
import { ButtonGroupRtl } from "#/registry/button-group/rtl.example";
import { ButtonGroupSelect } from "#/registry/button-group/select.example";
import { ButtonGroupSeparatorDemo } from "#/registry/button-group/separator.example";
import { ButtonGroupSize } from "#/registry/button-group/size.example";
import { ButtonGroupSplit } from "#/registry/button-group/split.example";
import { docSource } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const buttonGroupDoc: ComponentDoc = {
  examples: [
    {
      id: "button-group-dropdown",
      title: "Dropdown Menu",
      description: "Create a split button group with a DropdownMenu component.",
      Demo: ButtonGroupDropdown,
      source: docSource("button-group", "dropdown"),
    },
    {
      id: "button-group-input",
      title: "Input",
      description: "Wrap an Input component with buttons.",
      Demo: ButtonGroupInput,
      source: docSource("button-group", "input"),
    },
    {
      id: "button-group-input-group",
      title: "Input Group",
      description: "Wrap an InputGroup component to create complex input layouts.",
      Demo: ButtonGroupInputGroup,
      source: docSource("button-group", "input-group"),
    },
    {
      id: "button-group-nested",
      title: "Nested",
      description: "Nest <ButtonGroup> components to create button groups with spacing.",
      Demo: ButtonGroupNested,
      source: docSource("button-group", "nested"),
    },
    {
      id: "button-group-orientation",
      title: "Orientation",
      description: "Set the orientation prop to change the button group layout.",
      Demo: ButtonGroupOrientation,
      source: docSource("button-group", "orientation"),
    },
    {
      id: "button-group-popover",
      title: "Popover",
      description: "Use with a Popover component.",
      Demo: ButtonGroupPopover,
      source: docSource("button-group", "popover"),
    },
    {
      id: "button-group-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: ButtonGroupRtl,
      source: docSource("button-group", "rtl"),
      direction: "rtl",
    },
    {
      id: "button-group-select",
      title: "Select",
      description: "Pair with a Select component.",
      Demo: ButtonGroupSelect,
      source: docSource("button-group", "select"),
    },
    {
      id: "button-group-separator",
      title: "Separator",
      description:
        "Buttons with variant outline do not need a separator since they have a border. For other variants, a separator is recommended to improve the visual hierarchy.",
      Demo: ButtonGroupSeparatorDemo,
      source: docSource("button-group", "separator"),
    },
    {
      id: "button-group-size",
      title: "Size",
      description: "Control the size of buttons using the size prop on individual buttons.",
      Demo: ButtonGroupSize,
      source: docSource("button-group", "size"),
    },
    {
      id: "button-group-split",
      title: "Split",
      description: "Create a split button group by adding two buttons separated by a ButtonGroupSeparator.",
      Demo: ButtonGroupSplit,
      source: docSource("button-group", "split"),
    },
  ],
  anatomy: [{ name: "ButtonGroup" }],
  api: [
    {
      name: "ButtonGroup",
      description: "Joins adjacent buttons into one visual control.",
      props: [
        {
          name: "orientation",
          type: '"horizontal" | "vertical"',
          default: '"horizontal"',
          description: "Lay the buttons in a row or a column.",
        },
      ],
    },
    {
      name: "ButtonGroupText / ButtonGroupSeparator",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "A non-button label, or a divider between segments.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "Grouping is visual — each button keeps its own role and label.",
      "For one-of-many or multi-select toggles, use a Toggle Group instead.",
      "Keep related actions together; don’t mix unrelated buttons.",
    ],
  },
  guidelines: {
    do: ["Group closely-related actions (copy/paste, prev/next).", "Add a ButtonGroupText label for split controls."],
    dont: ["Don’t put toggle state here — use Toggle Group.", "Don’t cram unrelated actions into one group."],
  },
  related: ["button", "toggle-group", "pagination"],
};
