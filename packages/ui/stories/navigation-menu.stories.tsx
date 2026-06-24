import { BookOpenIcon, LayoutGridIcon, PaletteIcon, RocketIcon, SquareMousePointerIcon, TableIcon } from "lucide-react";
import type { ComponentType } from "react";
import { expect, screen } from "storybook/test";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "#/components/navigation-menu";

import preview from "../.storybook/preview";

const GUIDES = [
  {
    title: "Introduction",
    description: "Overview of the design system.",
    Icon: BookOpenIcon,
  },
  {
    title: "Installation",
    description: "Add components in one command.",
    Icon: RocketIcon,
  },
  {
    title: "Theming",
    description: "Customise tokens and dark mode.",
    Icon: PaletteIcon,
  },
];

const COMPONENTS = [
  {
    title: "Button",
    description: "Triggers an action or event.",
    Icon: SquareMousePointerIcon,
  },
  {
    title: "Dialog",
    description: "A modal overlay window.",
    Icon: LayoutGridIcon,
  },
  { title: "Table", description: "Display tabular data.", Icon: TableIcon },
  {
    title: "Layout",
    description: "Cards, grids, and panels.",
    Icon: LayoutGridIcon,
  },
];

function ListItem({
  title,
  description,
  Icon,
}: {
  title: string;
  description: string;
  Icon: ComponentType<{ className?: string }>;
}) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a className="flex gap-3 rounded-md p-3 hover:bg-muted" href="/components">
          <Icon className="size-5 shrink-0 text-primary" />
          <div className="space-y-0.5">
            <div className="text-sm font-medium text-foreground">{title}</div>
            <p className="text-xs leading-snug text-muted-foreground">{description}</p>
          </div>
        </a>
      </NavigationMenuLink>
    </li>
  );
}

/**
 * NavigationMenu is a composition of root + list + item + trigger + content
 * parts, so it's demoed via `render` rather than binding `component` (which
 * would force `args` onto every story — see Button for the prop-driven case).
 */
const meta = preview.meta({
  component: NavigationMenu,
  subcomponents: {
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuTrigger,
    NavigationMenuContent,
    NavigationMenuLink,
    NavigationMenuIndicator,
    NavigationMenuViewport,
  },
  parameters: {
    docs: {
      description: {
        component: [
          "A collection of links and dropdown panels for navigating a site.",
          "",
          "**Anatomy:** `NavigationMenu > NavigationMenuList > NavigationMenuItem > (NavigationMenuTrigger + NavigationMenuContent | NavigationMenuLink)`, with `NavigationMenuIndicator` and `NavigationMenuViewport` for the active arrow and shared content surface.",
          "Triggers reveal a `NavigationMenuContent` panel; plain entries use `NavigationMenuLink`.",
        ].join("\n"),
      },
    },
  },
  title: "Navigation/NavigationMenu",
});

export const Default = meta.story({
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-2 p-4 md:w-115 md:grid-cols-[.9fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <a
                    className="flex h-full flex-col justify-end rounded-md bg-gradient-to-br from-primary/80 to-violet-500 p-4 text-white no-underline"
                    href="/"
                  >
                    <RocketIcon className="size-6" />
                    <div className="mt-3 text-sm font-semibold">codefast/ui</div>
                    <p className="text-xs leading-snug text-white/80">
                      Accessible React components on Radix UI and Tailwind CSS v4.
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
              {GUIDES.map((guide) => (
                <ListItem key={guide.title} {...guide} />
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>Components</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-2 p-4 md:w-120 md:grid-cols-2">
              {COMPONENTS.map((component) => (
                <ListItem key={component.title} {...component} />
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <a className="px-3 py-2 text-sm font-medium" href="/about">
              Docs
            </a>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
});

/** `viewport={false}` renders each content panel inline under its own item instead of a shared viewport. */
export const WithoutViewport = meta.story({
  render: () => (
    <NavigationMenu viewport={false}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-2 p-4 md:w-115 md:grid-cols-[.9fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <a
                    className="flex h-full flex-col justify-end rounded-md bg-gradient-to-br from-primary/80 to-violet-500 p-4 text-white no-underline"
                    href="/"
                  >
                    <RocketIcon className="size-6" />
                    <div className="mt-3 text-sm font-semibold">codefast/ui</div>
                    <p className="text-xs leading-snug text-white/80">
                      Accessible React components on Radix UI and Tailwind CSS v4.
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
              {GUIDES.map((guide) => (
                <ListItem key={guide.title} {...guide} />
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>Components</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-2 p-4 md:w-120 md:grid-cols-2">
              {COMPONENTS.map((component) => (
                <ListItem key={component.title} {...component} />
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
});

export const OpensOnTriggerClick = meta.story({
  render: Default.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
OpensOnTriggerClick.test("opens on trigger click", async ({ canvas, userEvent }) => {
  const trigger = canvas.getByRole("button", { name: /getting started/i });

  await userEvent.click(trigger);

  // Content may be portalled into the viewport outside `canvasElement`, so
  // fall back to the document-wide `screen` query.
  await expect(await screen.findByText(/Accessible React components/i)).toBeVisible();
});
