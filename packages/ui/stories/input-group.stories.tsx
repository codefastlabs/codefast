import { SearchIcon } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "#/components/input-group";

import preview from "../.storybook/preview";

const meta = preview.meta({
  component: InputGroup,
  subcomponents: { InputGroupInput, InputGroupTextarea, InputGroupAddon, InputGroupButton, InputGroupText },
  parameters: {
    docs: {
      description: {
        component: [
          "A container that fuses an input (or textarea) with leading/trailing addons, buttons, and text into one control.",
          "",
          "**Anatomy:** `InputGroup > (InputGroupAddon · InputGroupInput / InputGroupTextarea · InputGroupButton · InputGroupText)`.",
          "Use `InputGroupAddon` with `align` to position icons/controls on either side of the field.",
        ].join("\n"),
      },
    },
  },
  title: "Form/InputGroup",
});

export const Default = meta.story({
  render: () => (
    <div className="w-full max-w-sm space-y-3">
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput placeholder="example.com" />
      </InputGroup>

      <InputGroup>
        <InputGroupAddon align="inline-start">
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput placeholder="Search…" />
      </InputGroup>

      <InputGroup>
        <InputGroupInput placeholder="Amount" type="number" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton variant="outline">USD</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
});

export const WithIcon = meta.story({
  render: () => (
    <InputGroup className="w-full max-w-sm">
      <InputGroupAddon align="inline-start">
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search components…" />
    </InputGroup>
  ),
});

export const WithButton = meta.story({
  render: () => (
    <InputGroup className="w-full max-w-sm">
      <InputGroupInput placeholder="Amount" type="number" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton variant="outline">USD</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
});
