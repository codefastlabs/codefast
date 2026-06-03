import type { ComponentDoc } from "#/components/examples/docs/types";
import {
  contextMenuAnatomyCode,
  contextMenuActionsCode,
  contextMenuEditorCode,
} from "#/components/examples/codes";
import { ContextMenuActions } from "#/components/examples/docs/context-menu/actions";
import { ContextMenuEditor } from "#/components/examples/docs/context-menu/editor";

export const contextMenuDoc: ComponentDoc = {
  examples: [
    {
      id: "stateful",
      title: "Checkbox & radio",
      description:
        "Right-click the canvas — checkbox items and a radio group drive state, echoed below.",
      Demo: ContextMenuEditor,
      code: contextMenuEditorCode,
      previewClassName: "min-h-44",
    },
    {
      id: "submenu",
      title: "Actions & submenu",
      description: "A classic actions menu with shortcuts and a nested submenu.",
      Demo: ContextMenuActions,
      code: contextMenuActionsCode,
      previewClassName: "min-h-44",
    },
  ],
  anatomy: contextMenuAnatomyCode,
  api: [
    {
      name: "ContextMenuTrigger",
      description: "The region that opens the menu on right-click (or long-press).",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "The area users right-click. Style it however you like.",
        },
      ],
    },
    {
      name: "ContextMenuCheckboxItem / RadioGroup",
      props: [
        {
          name: "checked / onCheckedChange",
          type: "boolean / (checked: boolean) => void",
          description: "On a checkbox item: its toggled state.",
        },
        {
          name: "value / onValueChange",
          type: "string / (value: string) => void",
          description: "On a radio group: the selected RadioItem value.",
        },
      ],
    },
    {
      name: "ContextMenuSub",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "Pair ContextMenuSubTrigger with ContextMenuSubContent for a submenu.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Arrow", "Down"], description: "Moves to the next item (once open)." },
      { keys: ["Arrow", "Right"], description: "Opens the focused submenu." },
      { keys: ["Enter"], description: "Activates the focused item." },
      { keys: ["Esc"], description: "Closes the menu." },
    ],
    notes: [
      "Opens with the context-menu key or long-press, not just right-click.",
      "Checkbox and radio items expose aria-checked for assistive tech.",
      "Always offer the same actions elsewhere — a context menu must not be the only path.",
    ],
  },
  guidelines: {
    do: [
      "Use for contextual shortcuts on an element (canvas, row, file).",
      "Mirror the most-used items in a visible toolbar or button menu.",
    ],
    dont: [
      "Don’t hide primary actions only behind right-click.",
      "Don’t nest submenus more than one level deep.",
    ],
  },
  related: ["dropdown-menu", "menubar", "command"],
};
