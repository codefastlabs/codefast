import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@codefast/ui/navigation-menu";
import { BookOpenIcon, LayoutGridIcon, PaletteIcon, RocketIcon, SquareMousePointerIcon, TableIcon } from "lucide-react";
import type { ComponentType } from "react";

const GUIDES = [
  { title: "Introduction", description: "Overview of the design system.", Icon: BookOpenIcon },
  { title: "Installation", description: "Add components in one command.", Icon: RocketIcon },
  { title: "Theming", description: "Customise tokens and dark mode.", Icon: PaletteIcon },
];

const COMPONENTS = [
  { title: "Button", description: "Triggers an action or event.", Icon: SquareMousePointerIcon },
  { title: "Dialog", description: "A modal overlay window.", Icon: LayoutGridIcon },
  { title: "Table", description: "Display tabular data.", Icon: TableIcon },
  { title: "Layout", description: "Cards, grids, and panels.", Icon: LayoutGridIcon },
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
        <a className="flex gap-3 rounded-md p-3 hover:bg-ui-surface" href="/components">
          <Icon className="size-5 shrink-0 text-ui-brand" />
          <div className="space-y-0.5">
            <div className="text-sm font-medium text-ui-fg">{title}</div>
            <p className="text-xs leading-snug text-ui-muted">{description}</p>
          </div>
        </a>
      </NavigationMenuLink>
    </li>
  );
}

export function NavigationMenuDemo() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-2 p-4 md:w-115 md:grid-cols-[.9fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <a
                    className="flex h-full flex-col justify-end rounded-md bg-gradient-to-br from-ui-brand/80 to-violet-500 p-4 text-white no-underline"
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
            <a className="px-3 py-2 text-sm font-medium" href="/docs">
              Docs
            </a>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
