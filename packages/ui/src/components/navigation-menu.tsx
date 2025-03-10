import type { ComponentProps, JSX } from 'react';

import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu';
import { ChevronDownIcon } from 'lucide-react';

import { buttonVariants } from '@/components/button';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: NavigationMenu
 * -------------------------------------------------------------------------- */

function NavigationMenu({
  children,
  className,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Root>): JSX.Element {
  return (
    <NavigationMenuPrimitive.Root
      className={cn('relative z-30 flex max-w-max flex-1 items-center justify-center', className)}
      data-slot="navigation-menu"
      {...props}
    >
      {children}
      <NavigationMenuViewport />
    </NavigationMenuPrimitive.Root>
  );
}

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuList
 * -------------------------------------------------------------------------- */

function NavigationMenuList({
  children,
  className,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.List>): JSX.Element {
  return (
    <NavigationMenuPrimitive.List
      className={cn('group flex flex-1 list-none items-center justify-center space-x-1', className)}
      data-slot="navigation-menu-list"
      {...props}
    >
      {children}
      <NavigationMenuIndicator />
    </NavigationMenuPrimitive.List>
  );
}

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuItem
 * -------------------------------------------------------------------------- */

function NavigationMenuItem({ ...props }: ComponentProps<typeof NavigationMenuPrimitive.Item>): JSX.Element {
  return <NavigationMenuPrimitive.Item data-slot="navigation-menu-item" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuContent
 * -------------------------------------------------------------------------- */

function NavigationMenuTrigger({
  children,
  className,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Trigger>): JSX.Element {
  return (
    <NavigationMenuPrimitive.Trigger
      className={buttonVariants({
        className: ['data-[state=open]:bg-accent data-[state=open]:text-accent-foreground group', className],
        variant: 'ghost',
      })}
      data-slot="navigation-menu-trigger"
      {...props}
    >
      {children}
      <ChevronDownIcon
        aria-hidden="true"
        className={cn('relative top-px ml-1 size-3 transition duration-300 group-data-[state=open]:rotate-180')}
      />
    </NavigationMenuPrimitive.Trigger>
  );
}

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuContent
 * -------------------------------------------------------------------------- */

function NavigationMenuContent({
  className,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Content>): JSX.Element {
  return (
    <NavigationMenuPrimitive.Content
      className={cn(
        'data-[motion^=from-]:animate-in data-[motion^=from-]:fade-in-0 data-[motion=from-end]:slide-from-r-52 data-[motion=from-start]:slide-from-l-52 data-[motion^=to-]:animate-out data-[motion^=to-]:fade-out-0 data-[motion=to-end]:slide-to-r-52 data-[motion=to-start]:slide-to-l-52 left-0 top-0 w-full md:absolute md:w-auto',
        className,
      )}
      data-slot="navigation-menu-content"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuLink
 * -------------------------------------------------------------------------- */

function NavigationMenuLink({ className, ...props }: ComponentProps<typeof NavigationMenuPrimitive.Link>): JSX.Element {
  return (
    <NavigationMenuPrimitive.Link
      className={cn(
        "data-[active=true]:focus:bg-accent data-[active=true]:hover:bg-accent data-[active=true]:bg-accent/50 data-[active=true]:text-accent-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ring-ring/10 dark:ring-ring/20 dark:outline-ring/40 outline-ring/50 flex flex-col gap-1 rounded-sm p-2 text-sm transition-[color,box-shadow,border-color,background-color] focus-visible:outline-1 focus-visible:ring-4 [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
        className,
      )}
      data-slot="navigation-menu-link"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuViewport
 * -------------------------------------------------------------------------- */

function NavigationMenuViewport({
  className,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Viewport>): JSX.Element {
  return (
    <div className="perspective-2000 absolute left-0 top-full flex justify-center">
      <NavigationMenuPrimitive.Viewport
        className={cn(
          'bg-popover text-popover-foreground h-(--radix-navigation-menu-viewport-height) sm:w-(--radix-navigation-menu-viewport-width) data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-90 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 relative mt-2 w-full origin-[top_center] overflow-hidden rounded-lg border p-1 shadow-lg',
          className,
        )}
        data-slot="navigation-menu-viewport"
        {...props}
      />
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuIndicator
 * -------------------------------------------------------------------------- */

function NavigationMenuIndicator({
  className,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Indicator>): JSX.Element {
  return (
    <NavigationMenuPrimitive.Indicator
      className={cn(
        'data-[state=visible]:animate-fade-in data-[state=visible]:animation-duration-100 data-[state=hidden]:animate-fade-out data-[state=hidden]:animation-duration-100 data-[state=hidden]:animation-ease-[cubic-bezier(0.32, 0.72, 0, 1)] top-full z-30 flex h-2 origin-[bottom_center] items-center justify-center overflow-hidden',
        className,
      )}
      data-slot="navigation-menu-indicator"
      {...props}
    >
      <div className="bg-popover text-popover-foreground rounded-tl-xs relative top-[60%] size-2.5 rotate-45" />
    </NavigationMenuPrimitive.Indicator>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
};
