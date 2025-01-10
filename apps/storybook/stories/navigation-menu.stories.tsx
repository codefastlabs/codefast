import type { Meta, StoryObj } from '@storybook/react';
import type { AnchorHTMLAttributes } from 'react';

import {
  buttonVariants,
  cn,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  Text,
} from '@codefast/ui';
import { SettingsIcon } from 'lucide-react';
import Link from 'next/link';
import { forwardRef } from 'react';

const meta = {
  component: NavigationMenu,
  decorators: [
    (Story) => (
      <div className="h-[70dvh]">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  title: 'UI/Navigation Menu',
} satisfies Meta<typeof NavigationMenu>;

export default meta;

type Story = StoryObj<typeof NavigationMenu>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

const components: { description: string; href: string; title: string }[] = [
  {
    description:
      'A modal dialog that interrupts the user with important content and expects a response.',
    href: '/',
    title: 'Alert Dialog',
  },
  {
    description: 'For sighted users to preview content available behind a link.',
    href: '/',
    title: 'Hover Card',
  },
  {
    description:
      'Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.',
    href: '/',
    title: 'Progress',
  },
  {
    description: 'Visually or semantically separates content.',
    href: '/',
    title: 'Scroll-area',
  },
  {
    description:
      'A set of layered sections of content—known as tab panels—that are displayed one at a time.',
    href: '/',
    title: 'Tabs',
  },
  {
    description:
      'A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.',
    href: '/',
    title: 'Tooltip',
  },
];

const ListItem = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(
  ({ children, className, title, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            className={cn(
              'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors',
              className,
            )}
            {...props}
          >
            <div className="text-sm font-medium leading-none">{title}</div>
            <Text className="text-muted-foreground line-clamp-2 text-sm leading-snug">
              {children}
            </Text>
          </a>
        </NavigationMenuLink>
      </li>
    );
  },
);

ListItem.displayName = 'ListItem';

export const Default: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem value="menu-0">
          <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-6 sm:w-[400px] md:w-[500px] md:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <a
                    className="from-muted/50 to-muted flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b p-6 no-underline outline-none focus:shadow-md"
                    href="/apps/docs/public"
                  >
                    <SettingsIcon className="size-6" />
                    <div className="mb-2 mt-4 text-lg font-medium">@codefast/ui</div>
                    <Text className="text-muted-foreground text-sm leading-tight">
                      Beautifully designed components that you can copy and paste into your apps.
                      Accessible. Customizable. Open Source.
                    </Text>
                  </a>
                </NavigationMenuLink>
              </li>
              <ListItem href="/" title="Introduction">
                Re-usable components built using Radix UI and Tailwind CSS.
              </ListItem>
              <ListItem href="/" title="Installation">
                How to install dependencies and structure your app.
              </ListItem>
              <ListItem href="/" title="Typography">
                Styles for headings, paragraphs, lists...etc
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem value="menu-1">
          <NavigationMenuTrigger>Components</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 sm:w-[500px] sm:grid-cols-2 md:w-[600px]">
              {components.map((component) => (
                <ListItem key={component.title} href={component.href} title={component.title}>
                  {component.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem value="menu-2">
          <NavigationMenuLink asChild className={buttonVariants({ variant: 'ghost' })}>
            <Link href="/apps/docs/public">Documentation</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};
