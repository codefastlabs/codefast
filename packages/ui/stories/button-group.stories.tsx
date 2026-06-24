import { ChevronDownIcon, MinusIcon, PlusIcon } from "lucide-react";

import { Button } from "#/components/button";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "#/components/button-group";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "#/components/dropdown-menu";

import preview from "../.storybook/preview";

const meta = preview.meta({
  args: { orientation: "horizontal" },
  component: ButtonGroup,
  subcomponents: { ButtonGroupSeparator, ButtonGroupText },
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
  title: "Form/ButtonGroup",
});

export const Default = meta.story({
  render: (args) => (
    /* Split button: primary action + dropdown of related actions */
    <ButtonGroup {...args}>
      <Button>
        <PlusIcon />
        New issue
      </Button>
      <ButtonGroupSeparator />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-label="More create options" size="icon">
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

export const Orientation = meta.story({
  render: () => (
    <ButtonGroup orientation="vertical" aria-label="Media controls" className="h-fit">
      <Button variant="outline" size="icon">
        <PlusIcon />
      </Button>
      <Button variant="outline" size="icon">
        <MinusIcon />
      </Button>
    </ButtonGroup>
  ),
});

export const WithSeparator = meta.story({
  render: () => (
    <ButtonGroup>
      <Button variant="secondary" size="sm">
        Copy
      </Button>
      <ButtonGroupSeparator />
      <Button variant="secondary" size="sm">
        Paste
      </Button>
    </ButtonGroup>
  ),
});

export const Sizes = meta.story({
  render: () => (
    <div className="flex flex-col items-start gap-8">
      <ButtonGroup>
        <Button variant="outline" size="sm">
          Small
        </Button>
        <Button variant="outline" size="sm">
          Button
        </Button>
        <Button variant="outline" size="sm">
          Group
        </Button>
        <Button variant="outline" size="icon-sm">
          <PlusIcon />
        </Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="outline">Default</Button>
        <Button variant="outline">Button</Button>
        <Button variant="outline">Group</Button>
        <Button variant="outline" size="icon">
          <PlusIcon />
        </Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="outline" size="lg">
          Large
        </Button>
        <Button variant="outline" size="lg">
          Button
        </Button>
        <Button variant="outline" size="lg">
          Group
        </Button>
        <Button variant="outline" size="icon-lg">
          <PlusIcon />
        </Button>
      </ButtonGroup>
    </div>
  ),
});
