import { SearchIcon } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "#/components/input-group";

import preview from "../.storybook/preview";

/**
 * Input Group is a composition with no required root props, but its meaning lives
 * in the addon/input children — demoed via `render`, no `component` binding.
 */
const meta = preview.meta({
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
