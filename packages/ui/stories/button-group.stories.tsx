import { ChevronDownIcon, PlusIcon } from "lucide-react";
import { expect, screen } from "storybook/test";

import { Button } from "#/components/button";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "#/components/button-group";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "#/components/dropdown-menu";

import preview from "../.storybook/preview";

/**
 * ButtonGroup — a layout COMPOSITE whose root is a plain `<div role="group">` with a single
 * `orientation` enum. Children (Button / ButtonGroupSeparator / ButtonGroupText) compose the
 * segmented unit. Content here is authored for Storybook against the component's own public API,
 * not synced with the apps/web registry.
 *
 * **Anatomy:** `ButtonGroup > (Button… · ButtonGroupSeparator · ButtonGroupText)`.
 */
const meta = preview.meta({
  args: { orientation: "horizontal" },
  argTypes: {
    orientation: { control: "radio", options: ["horizontal", "vertical"] },
  },
  component: ButtonGroup,
  parameters: {
    docs: {
      description: {
        component: [
          "A container that visually joins related buttons (and other controls) into a single segmented unit.",
          "",
          "**Anatomy:** `ButtonGroup > (Button… · ButtonGroupSeparator · ButtonGroupText)`.",
          "Place `Button`s directly inside; use `ButtonGroupSeparator` to divide segments and `ButtonGroupText` for inline labels.",
        ].join("\n"),
      },
    },
  },
  subcomponents: { ButtonGroupSeparator, ButtonGroupText },
  title: "Form/ButtonGroup",
});

/** Split button: primary action + dropdown of related actions. */
export const Default = meta.story({
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="outline">
        <PlusIcon />
        New issue
      </Button>
      <ButtonGroupSeparator />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-label="More create options" size="icon" variant="outline">
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>New from template</DropdownMenuItem>
          <DropdownMenuItem>Import issues</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  ),
});

export const Vertical = meta.story({
  args: { orientation: "vertical" },
  render: Default.input.render,
});

/** A separate composition: inline label text joined to a trailing control. */
export const WithText = meta.story({
  render: (args) => (
    <ButtonGroup {...args}>
      <ButtonGroupText>Sort by</ButtonGroupText>
      <Button variant="outline">Newest</Button>
    </ButtonGroup>
  ),
});

Default.test("opens the related-actions dropdown when the chevron is clicked", async ({ canvas, userEvent }) => {
  const trigger = canvas.getByRole("button", { name: "More create options" });

  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await userEvent.click(trigger);

  // Dropdown content is portalled — query the document, not the canvas.
  await expect(await screen.findByText("New from template")).toBeInTheDocument();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
});
