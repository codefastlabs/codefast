import type { ComponentProps, JSX } from 'react';

import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu';
import { ChevronDownIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/variants/button.variants';

/* -----------------------------------------------------------------------------
 * Component: NavigationMenu
 * -------------------------------------------------------------------------- */

type NavigationMenuProps = ComponentProps<typeof NavigationMenuPrimitive.Root>;

function NavigationMenu({ children, className, ...props }: NavigationMenuProps): JSX.Element {
  return (
    <NavigationMenuPrimitive.Root
      className={cn('relative z-10 flex max-w-max flex-1 items-center justify-center', className)}
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

type NavigationMenuListProps = ComponentProps<typeof NavigationMenuPrimitive.List>;

function NavigationMenuList({ children, className, ...props }: NavigationMenuListProps): JSX.Element {
  return (
    <NavigationMenuPrimitive.List
      className={cn('group flex flex-1 list-none items-center justify-center space-x-1', className)}
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

type NavigationMenuItemProps = ComponentProps<typeof NavigationMenuPrimitive.Item>;

const NavigationMenuItem = NavigationMenuPrimitive.Item;

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuContent
 * -------------------------------------------------------------------------- */

type NavigationMenuTriggerProps = ComponentProps<typeof NavigationMenuPrimitive.Trigger>;

function NavigationMenuTrigger({ children, className, ...props }: NavigationMenuTriggerProps): JSX.Element {
  return (
    <NavigationMenuPrimitive.Trigger
      className={buttonVariants({
        className: ['data-[state=open]:bg-accent data-[state=open]:text-accent-foreground', 'group', className],
        variant: 'ghost',
      })}
      {...props}
    >
      {children}
      <ChevronDownIcon
        aria-hidden="true"
        className={cn('relative top-px ml-1 size-3 transition', 'group-data-[state=open]:rotate-180')}
      />
    </NavigationMenuPrimitive.Trigger>
  );
}

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuContent
 * -------------------------------------------------------------------------- */

type NavigationMenuContentProps = ComponentProps<typeof NavigationMenuPrimitive.Content>;

function NavigationMenuContent({ className, ...props }: NavigationMenuContentProps): JSX.Element {
  return (
    <NavigationMenuPrimitive.Content
      className={cn(
        'left-0 top-0 w-full md:absolute md:w-auto',
        'data-[motion^=from-]:animate-in data-[motion^=from-]:fade-in',
        'data-[motion=from-end]:slide-in-from-right-52',
        'data-[motion=from-start]:slide-in-from-left-52',
        'data-[motion^=to-]:animate-out data-[motion^=to-]:fade-out',
        'data-[motion=to-end]:slide-out-to-right-52',
        'data-[motion=to-start]:slide-out-to-left-52',
        className,
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuLink
 * -------------------------------------------------------------------------- */

type NavigationMenuLinkProps = ComponentProps<typeof NavigationMenuPrimitive.Link>;

const NavigationMenuLink = NavigationMenuPrimitive.Link;

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuViewport
 * -------------------------------------------------------------------------- */

type NavigationMenuViewportProps = ComponentProps<typeof NavigationMenuPrimitive.Viewport>;

function NavigationMenuViewport({ className, ...props }: NavigationMenuViewportProps): JSX.Element {
  return (
    <div className="perspective-[125rem] absolute left-0 top-full flex justify-center">
      <NavigationMenuPrimitive.Viewport
        className={cn(
          'bg-popover text-popover-foreground relative mt-1.5 w-full origin-[top_center] overflow-hidden rounded-md border p-1 shadow-md transition-[width,height]',
          'h-(--radix-navigation-menu-viewport-height) sm:w-(--radix-navigation-menu-viewport-width)',
          'data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-90',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95',
          className,
        )}
        {...props}
      />
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuIndicator
 * -------------------------------------------------------------------------- */

type NavigationMenuIndicatorProps = ComponentProps<typeof NavigationMenuPrimitive.Indicator>;

function NavigationMenuIndicator({ className, ...props }: NavigationMenuIndicatorProps): JSX.Element {
  return (
    <NavigationMenuPrimitive.Indicator
      className={cn(
        'data-[state=visible]:animate-fade-in data-[state=hidden]:animate-fade-out top-full z-10 flex h-1.5 items-center justify-center overflow-hidden transition',
        className,
      )}
      {...props}
    >
      <div className="bg-popover relative top-[60%] size-2 rotate-45 rounded-tl-sm" />
    </NavigationMenuPrimitive.Indicator>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type {
  NavigationMenuContentProps,
  NavigationMenuItemProps,
  NavigationMenuLinkProps,
  NavigationMenuListProps,
  NavigationMenuProps,
  NavigationMenuTriggerProps,
};
export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
};
