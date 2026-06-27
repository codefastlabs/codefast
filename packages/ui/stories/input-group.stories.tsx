import { SearchIcon } from "lucide-react";
import { expect } from "storybook/test";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "#/components/input-group";

import preview from "../.storybook/preview";

/**
 * InputGroup — a LAYOUT-ONLY composite. The root `InputGroup` is a plain
 * `<div role="group">` (its props are just `ComponentProps<"div">`), so it
 * exposes no Controls of its own; the interesting variant (`align`) lives on
 * the `InputGroupAddon` subcomponent. Content here is authored against the
 * component's own public API for Storybook, NOT synced with the apps/web registry.
 *
 * **Anatomy:** `InputGroup > (InputGroupAddon · InputGroupInput / InputGroupTextarea · InputGroupButton · InputGroupText)`.
 */
const meta = preview.meta({
  component: InputGroup,
  parameters: {
    docs: {
      description: {
        component: [
          "A container that fuses an input (or textarea) with leading/trailing addons, buttons, and text into one control.",
          "",
          "**Anatomy:** `InputGroup > (InputGroupAddon · InputGroupInput / InputGroupTextarea · InputGroupButton · InputGroupText)`.",
          "Use `InputGroupAddon` with `align` (`inline-start` · `inline-end` · `block-start` · `block-end`) to position icons/controls around the field.",
        ].join("\n"),
      },
    },
  },
  subcomponents: { InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText, InputGroupTextarea },
  title: "Form/InputGroup",
});

export const Default = meta.story({
  render: (args) => (
    <InputGroup className="w-full max-w-sm" {...args}>
      <InputGroupAddon align="inline-start">
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search components…" />
    </InputGroup>
  ),
});

/** Trailing addon hosting an `InputGroupButton` — a distinct composition. */
export const WithButton = meta.story({
  render: (args) => (
    <InputGroup className="w-full max-w-sm" {...args}>
      <InputGroupInput placeholder="Amount" type="number" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton variant="outline">USD</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
});

/** Leading `InputGroupText` prefix fused into the field — a distinct composition. */
export const WithTextPrefix = meta.story({
  render: (args) => (
    <InputGroup className="w-full max-w-sm" {...args}>
      <InputGroupAddon align="inline-start">
        <InputGroupText>https://</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder="example.com" />
    </InputGroup>
  ),
});

/** Block-aligned addon turns the group into a multi-line textarea layout. */
export const WithTextarea = meta.story({
  render: (args) => (
    <InputGroup className="w-full max-w-sm" {...args}>
      <InputGroupTextarea placeholder="Write a message…" rows={3} />
      <InputGroupAddon align="block-end">
        <InputGroupText>Markdown supported</InputGroupText>
        <InputGroupButton variant="outline">Send</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
});

/** Reuses the Default composition; same JSX, only behavior under test differs. */
export const TypesIntoField = meta.story({ render: Default.input.render });

TypesIntoField.test("accepts typed input through the fused control", async ({ canvas, userEvent }) => {
  const field = canvas.getByPlaceholderText("Search components…");

  await userEvent.type(field, "accordion");

  await expect(field).toHaveValue("accordion");
});
