import type { ComponentProps, JSX } from "react";

import { CircleCheckIcon, CircleHelpIcon, CircleIcon } from "lucide-react";
import Link from "next/link";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@codefast/ui";

const components: { description: string; href: string; title: string }[] = [
  {
    description:
      "A modal dialog that interrupts the user with important content and expects a response.",
    href: "/components/alert-dialog",
    title: "Alert Dialog",
  },
  {
    description: "For sighted users to preview content available behind a link.",
    href: "/components/hover-card",
    title: "Hover Card",
  },
  {
    description:
      "Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.",
    href: "/components/progress",
    title: "Progress",
  },
  {
    description: "Visually or semantically separates content.",
    href: "/components/scroll-area",
    title: "Scroll-area",
  },
  {
    description:
      "A set of layered sections of content—known as tab panels—that are displayed one at a time.",
    href: "/components/tabs",
    title: "Tabs",
  },
  {
    description:
      "A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.",
    href: "/components/tooltip",
    title: "Tooltip",
  },
];

export function NavigationMenuDemo(): JSX.Element {
  return (
    <div className="@xl:flex hidden w-full flex-col items-center justify-center gap-6">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem value="getting-started">
            <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                <li className="row-span-3">
                  <NavigationMenuLink asChild>
                    <Link
                      className="from-muted/50 to-muted dark:from-accent/50 dark:to-accent bg-linear-to-b outline-hidden flex h-full w-full select-none flex-col justify-end rounded-md p-6 no-underline focus:shadow-md"
                      href="/apps/docs/public"
                    >
                      <div className="mb-2 mt-4 text-lg font-medium">@codefast/ui</div>
                      <p className="text-muted-foreground text-sm leading-tight">
                        Beautifully designed components built with Tailwind CSS.
                      </p>
                    </Link>
                  </NavigationMenuLink>
                </li>
                <ListItem href="/#" title="Introduction">
                  Re-usable components built using Radix UI and Tailwind CSS.
                </ListItem>
                <ListItem href="/#" title="Installation">
                  How to install dependencies and structure your app.
                </ListItem>
                <ListItem href="/#" title="Typography">
                  Styles for headings, paragraphs, lists...etc
                </ListItem>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="components">
            <NavigationMenuTrigger>Components</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-2 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                {components.map((component) => (
                  <ListItem key={component.title} href={component.href} title={component.title}>
                    {component.description}
                  </ListItem>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="forms">
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <Link href="/apps/docs/public">Documentation</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <NavigationMenu viewport={false}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <Link href="/apps/docs/public">Documentation</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="list">
            <NavigationMenuTrigger>List</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[300px] gap-4">
                <li>
                  <NavigationMenuLink asChild>
                    <Link href="/components">
                      <div className="font-medium">Components</div>
                      <div className="text-muted-foreground">
                        Browse all components in the library.
                      </div>
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link href="/documentation">
                      <div className="font-medium">Documentation</div>
                      <div className="text-muted-foreground">Learn how to use the library.</div>
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link href="/blog">
                      <div className="font-medium">Blog</div>
                      <div className="text-muted-foreground">Read our latest blog posts.</div>
                    </Link>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="simple-list">
            <NavigationMenuTrigger>Simple List</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[200px] gap-4">
                <li>
                  <NavigationMenuLink asChild>
                    <Link href="/components">Components</Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link href="/documentation">Documentation</Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link href="/blocks">Blocks</Link>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="with-icon">
            <NavigationMenuTrigger>With Icon</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[200px] gap-4">
                <li>
                  <NavigationMenuLink asChild>
                    <Link className="flex-row items-center gap-2" href="/backlog">
                      <CircleHelpIcon />
                      Backlog
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link className="flex-row items-center gap-2" href="/todo">
                      <CircleIcon />
                      To Do
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link className="flex-row items-center gap-2" href="/done">
                      <CircleCheckIcon />
                      Done
                    </Link>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}

function ListItem({
  children,
  href,
  title,
  ...props
}: ComponentProps<"li"> & { href: string }): JSX.Element {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link href={href}>
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">{children}</p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}
