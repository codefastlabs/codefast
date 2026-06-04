import type { ComponentDoc } from "#/components/examples/docs/types";
import { docSource, docAnatomy } from "#/components/examples/docs/source";
import { ButtonGroupGroups } from "#/components/examples/docs/button-group/groups";

import { ButtonGroupIcons } from "#/components/examples/docs/button-group/icons";
import { ButtonGroupSizes } from "#/components/examples/docs/button-group/sizes";

export const buttonGroupDoc: ComponentDoc = {
  examples: [
    {
      id: "groups",
      title: "Joined controls",
      description:
        "Visually join buttons; add a separator or a text label, horizontal or vertical.",
      Demo: ButtonGroupGroups,
      code: docSource("button-group", "groups"),
    },
    {
      id: "icons",
      title: "Icon toolbar",
      description: "Group icon-only buttons into a seamless toolbar.",
      Demo: ButtonGroupIcons,
      code: docSource("button-group", "icons"),
    },
    {
      id: "sizes",
      title: "Sizes",
      description: "Match the group to its context with sm, default, or lg.",
      Demo: ButtonGroupSizes,
      code: docSource("button-group", "sizes"),
    },
  ],
  anatomy: docAnatomy("button-group"),
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
    do: [
      "Group closely-related actions (copy/paste, prev/next).",
      "Add a ButtonGroupText label for split controls.",
    ],
    dont: [
      "Don’t put toggle state here — use Toggle Group.",
      "Don’t cram unrelated actions into one group.",
    ],
  },
  related: ["button", "toggle-group", "pagination"],
};
