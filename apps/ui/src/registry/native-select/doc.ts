import { docSource, docUsage } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { NativeSelectDisabled } from "#/registry/native-select/disabled.example";
import { NativeSelectGroups } from "#/registry/native-select/groups.example";
import { NativeSelectInvalid } from "#/registry/native-select/invalid.example";
import { NativeSelectRtl } from "#/registry/native-select/rtl.example";

export const nativeSelectDoc: ComponentDoc = {
  usage: docUsage("native-select"),
  examples: [
    {
      id: "native-select-disabled",
      title: "Disabled",
      description: "Add the disabled prop to the NativeSelect component to disable the select.",
      Demo: NativeSelectDisabled,
      source: docSource("native-select", "disabled"),
    },
    {
      id: "native-select-groups",
      title: "Groups",
      description: "Use NativeSelectOptGroup to organize options into categories.",
      Demo: NativeSelectGroups,
      source: docSource("native-select", "groups"),
    },
    {
      id: "native-select-invalid",
      title: "Invalid",
      description:
        "Use aria-invalid to show validation errors and the data-invalid attribute to the Field component for styling.",
      Demo: NativeSelectInvalid,
      source: docSource("native-select", "invalid"),
    },
    {
      id: "native-select-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: NativeSelectRtl,
      source: docSource("native-select", "rtl"),
      direction: "rtl",
    },
  ],
  anatomy: [{ name: "NativeSelect", children: [{ name: "NativeSelectOption" }] }],
  features: [
    "A real native <select> — zero JS, full OS-native keyboard and screen-reader support, and the mobile picker UI.",
    "Two sizes (default, sm).",
    "NativeSelectOption/NativeSelectOptGroup use the Canvas/CanvasText CSS system colors, so options render correctly inside the browser's native dropdown popup in both light and dark mode.",
  ],
  api: [
    {
      name: "NativeSelect",
      description: "A styled native <select>. Forwards all native select props.",
      props: [
        {
          name: "value / onChange",
          type: "string / (event) => void",
          description: "Standard controlled select props.",
        },
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description: "Disables the control.",
        },
      ],
    },
    {
      name: "NativeSelectOptGroup / NativeSelectOption",
      props: [
        {
          name: "label / value",
          type: "string",
          description: "Group heading, and each option’s submitted value.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "It’s a real <select> — full native keyboard and screen-reader support, zero JS.",
      "Best for mobile and long lists where the OS picker is ideal.",
      "Pair with a Label via htmlFor / id.",
    ],
  },
  guidelines: {
    do: ["Use on mobile forms and when you want the native picker.", "Group long option lists with opt-groups."],
    dont: ["Don’t use it when you need custom option rendering — use Select.", "Don’t omit a label."],
  },
  related: ["select", "input", "field"],
};
