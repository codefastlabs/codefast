import { ChevronDownIcon, SlashIcon } from "lucide-react";
import { expect, screen } from "storybook/test";

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "#/components/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/dropdown-menu";

import preview from "../.storybook/preview";

/**
 * Breadcrumb — a LAYOUT-ONLY composite. The root `<nav>` carries no enum/boolean/number
 * props of its own, so it has no Controls; the visible variation lives in the parts you
 * compose (separator glyph, collapsed ellipsis, current page). Content here is authored
 * for Storybook against the component's own API, NOT synced with the apps/web registry.
 *
 * A flat `separator` arg drives whether the base composition renders the default chevron or
 * a custom slash, so its states reuse one render instead of duplicating the markup.
 */
interface BreadcrumbArgs {
  separator: "chevron" | "slash";
}

const meta = preview.type<{ args: BreadcrumbArgs }>().meta({
  args: { separator: "chevron" },
  argTypes: {
    separator: { control: "radio", options: ["chevron", "slash"] },
  },
  parameters: {
    docs: {
      description: {
        component: [
          "Displays the path to the current resource as a hierarchy of links.",
          "",
          "**Anatomy:** `Breadcrumb > BreadcrumbList > BreadcrumbItem > (BreadcrumbLink | BreadcrumbPage)` separated by `BreadcrumbSeparator`, with `BreadcrumbEllipsis` for collapsed segments.",
          "`BreadcrumbPage` marks the current page (it is non-interactive); collapse middle items behind `BreadcrumbEllipsis`.",
        ].join("\n"),
      },
    },
  },
  subcomponents: {
    Breadcrumb,
    BreadcrumbEllipsis,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
  },
  title: "Navigation/Breadcrumb",
});

export const Default = meta.story({
  render: ({ separator }) => {
    const sep = separator === "slash" ? <SlashIcon /> : undefined;

    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>{sep}</BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Components</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>{sep}</BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  },
});

/** Swap the default chevron for a custom slash glyph — same composition, different `separator` arg. */
export const CustomSeparator = meta.story({
  args: { separator: "slash" },
  render: Default.input.render,
});

/** Collapse middle segments behind `BreadcrumbEllipsis` for deep hierarchies. */
export const Collapsed = meta.story({
  render: () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Acme Website</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Settings</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
});

/** Replace a collapsed segment with a dropdown menu of sibling routes. */
export const WithDropdown = meta.story({
  render: () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1">
              Components
              <ChevronDownIcon className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuGroup>
                <DropdownMenuItem>Documentation</DropdownMenuItem>
                <DropdownMenuItem>Themes</DropdownMenuItem>
                <DropdownMenuItem>GitHub</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
});

WithDropdown.test("opens the sibling-route menu from a breadcrumb item", async ({ canvas, userEvent }) => {
  await userEvent.click(canvas.getByRole("button", { name: /Components/ }));

  // DropdownMenuContent is portalled — query the document, not the canvas.
  await expect(await screen.findByText("Documentation")).toBeInTheDocument();
  await expect(screen.getByText("Themes")).toBeInTheDocument();
});
