import { ChevronDownIcon } from '@radix-ui/react-icons';
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu';
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
} from 'react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/styles/button-variants';

/* -----------------------------------------------------------------------------
 * Component: NavigationMenu
 * -------------------------------------------------------------------------- */

type NavigationMenuElement = ComponentRef<typeof NavigationMenuPrimitive.Root>;
type NavigationMenuProps = ComponentPropsWithoutRef<
  typeof NavigationMenuPrimitive.Root
>;

const NavigationMenu = forwardRef<NavigationMenuElement, NavigationMenuProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <NavigationMenuPrimitive.Root
      ref={forwardedRef}
      className={cn(
        'relative z-10 flex max-w-max flex-1 items-center justify-center',
        className,
      )}
      {...props}
    >
      {children}
      <NavigationMenuViewport />
    </NavigationMenuPrimitive.Root>
  ),
);

NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuList
 * -------------------------------------------------------------------------- */

type NavigationMenuListElement = ComponentRef<
  typeof NavigationMenuPrimitive.List
>;
type NavigationMenuListProps = ComponentPropsWithoutRef<
  typeof NavigationMenuPrimitive.List
>;

const NavigationMenuList = forwardRef<
  NavigationMenuListElement,
  NavigationMenuListProps
>(({ children, className, ...props }, forwardedRef) => (
  <NavigationMenuPrimitive.List
    ref={forwardedRef}
    className={cn(
      'group flex flex-1 list-none items-center justify-center space-x-1',
      className,
    )}
    {...props}
  >
    {children}
    <NavigationMenuIndicator />
  </NavigationMenuPrimitive.List>
));

NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName;

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuItem
 * -------------------------------------------------------------------------- */

type NavigationMenuItemProps = ComponentPropsWithoutRef<
  typeof NavigationMenuPrimitive.Item
>;

const NavigationMenuItem = NavigationMenuPrimitive.Item;

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuContent
 * -------------------------------------------------------------------------- */

type NavigationMenuTriggerElement = ComponentRef<
  typeof NavigationMenuPrimitive.Trigger
>;
type NavigationMenuTriggerProps = ComponentPropsWithoutRef<
  typeof NavigationMenuPrimitive.Trigger
>;

const NavigationMenuTrigger = forwardRef<
  NavigationMenuTriggerElement,
  NavigationMenuTriggerProps
>(({ children, className, ...props }, forwardedRef) => (
  <NavigationMenuPrimitive.Trigger
    ref={forwardedRef}
    className={buttonVariants({
      variant: 'ghost',
      className: [
        'data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
        'group',
        className,
      ],
    })}
    {...props}
  >
    {children}
    <ChevronDownIcon
      aria-hidden="true"
      className={cn(
        'relative top-px ml-1 size-3 transition',
        'group-data-[state=open]:rotate-180',
      )}
    />
  </NavigationMenuPrimitive.Trigger>
));

NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName;

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuContent
 * -------------------------------------------------------------------------- */

type NavigationMenuContentElement = ComponentRef<
  typeof NavigationMenuPrimitive.Content
>;
type NavigationMenuContentProps = ComponentPropsWithoutRef<
  typeof NavigationMenuPrimitive.Content
>;

const NavigationMenuContent = forwardRef<
  NavigationMenuContentElement,
  NavigationMenuContentProps
>(({ className, ...props }, forwardedRef) => (
  <NavigationMenuPrimitive.Content
    ref={forwardedRef}
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
));

NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName;

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuLink
 * -------------------------------------------------------------------------- */

type NavigationMenuLinkProps = ComponentPropsWithoutRef<
  typeof NavigationMenuPrimitive.Link
>;

const NavigationMenuLink = NavigationMenuPrimitive.Link;

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuViewport
 * -------------------------------------------------------------------------- */

type NavigationMenuViewportElement = ComponentRef<
  typeof NavigationMenuPrimitive.Viewport
>;
type NavigationMenuViewportProps = ComponentPropsWithoutRef<
  typeof NavigationMenuPrimitive.Viewport
>;

const NavigationMenuViewport = forwardRef<
  NavigationMenuViewportElement,
  NavigationMenuViewportProps
>(({ className, ...props }, forwardedRef) => (
  <div className="perspective-[125rem] absolute left-0 top-full flex justify-center">
    <NavigationMenuPrimitive.Viewport
      ref={forwardedRef}
      className={cn(
        'bg-popover text-popover-foreground relative mt-1.5 w-full origin-[top_center] overflow-hidden rounded-md border p-1 shadow-md transition-[width,height]',
        'h-[var(--radix-navigation-menu-viewport-height)] sm:w-[var(--radix-navigation-menu-viewport-width)]',
        'data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-90',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95',
        className,
      )}
      {...props}
    />
  </div>
));

NavigationMenuViewport.displayName =
  NavigationMenuPrimitive.Viewport.displayName;

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuIndicator
 * -------------------------------------------------------------------------- */

type NavigationMenuIndicatorElement = ComponentRef<
  typeof NavigationMenuPrimitive.Indicator
>;
type NavigationMenuIndicatorProps = ComponentPropsWithoutRef<
  typeof NavigationMenuPrimitive.Indicator
>;

const NavigationMenuIndicator = forwardRef<
  NavigationMenuIndicatorElement,
  NavigationMenuIndicatorProps
>(({ className, ...props }, forwardedRef) => (
  <NavigationMenuPrimitive.Indicator
    ref={forwardedRef}
    className={cn(
      'data-[state=visible]:animate-fade-in data-[state=hidden]:animate-fade-out top-full z-10 flex h-1.5 items-center justify-center overflow-hidden transition',
      className,
    )}
    {...props}
  >
    <div className="bg-popover relative top-[60%] size-2 rotate-45 rounded-tl-sm" />
  </NavigationMenuPrimitive.Indicator>
));

NavigationMenuIndicator.displayName =
  NavigationMenuPrimitive.Indicator.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  NavigationMenu,
  NavigationMenuContent,
  type NavigationMenuContentProps,
  NavigationMenuItem,
  type NavigationMenuItemProps,
  NavigationMenuLink,
  type NavigationMenuLinkProps,
  NavigationMenuList,
  type NavigationMenuListProps,
  type NavigationMenuProps,
  NavigationMenuTrigger,
  type NavigationMenuTriggerProps,
};
