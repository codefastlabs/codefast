import type { ComponentDoc } from "#/components/examples/docs/types";
import {
  inputAnatomyCode,
  inputDefaultCode,
  inputFileCode,
  inputStatesCode,
} from "#/components/examples/codes";
import { InputDefault } from "#/components/examples/docs/input/default";
import { InputFile } from "#/components/examples/docs/input/file";
import { InputStates } from "#/components/examples/docs/input/states";

export const inputDoc: ComponentDoc = {
  examples: [
    {
      id: "default",
      title: "With label",
      description: "Pair Input with a Label and a helper line for an accessible field.",
      Demo: InputDefault,
      code: inputDefaultCode,
    },
    {
      id: "states",
      title: "States",
      description: "Default, disabled, read-only, and invalid (aria-invalid) styling.",
      Demo: InputStates,
      code: inputStatesCode,
    },
    {
      id: "file",
      title: "File input",
      description: 'type="file" is styled to match the rest of the form controls.',
      Demo: InputFile,
      code: inputFileCode,
    },
  ],
  anatomy: inputAnatomyCode,
  api: [
    {
      name: "Input",
      description: "Renders a native <input>; forwards every native input prop.",
      props: [
        {
          name: "type",
          type: '"text" | "email" | "password" | "file" | "number" | …',
          default: '"text"',
          description: "Native input type. file gets dedicated styling.",
        },
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description: "Dims the field and blocks interaction.",
        },
        {
          name: "aria-invalid",
          type: "boolean",
          default: "false",
          description: "Switches the field to the destructive error ring.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [{ keys: ["Tab"], description: "Moves focus to and from the input." }],
    notes: [
      "Always associate a Label via htmlFor / id so the field has an accessible name.",
      "Use aria-invalid plus a visible error message — colour alone is not sufficient.",
      "Describe the field with aria-describedby when you show helper or error text.",
    ],
  },
  guidelines: {
    do: [
      "Give every input a visible label.",
      "Use the correct type so mobile keyboards and autofill behave well.",
    ],
    dont: [
      "Don’t use placeholder text as a replacement for a label.",
      "Don’t disable a field when a read-only state would communicate intent better.",
    ],
  },
  related: ["input-group", "input-password", "textarea", "field"],
};
