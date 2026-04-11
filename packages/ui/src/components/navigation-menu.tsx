import type { ComponentProps, JSX } from "react";

import { cn, tv } from "#lib/utils";
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";
import { ChevronDownIcon } from "lucide-react";

import { buttonVariants } from "#components/button";

/* -----------------------------------------------------------------------------
 * Style: NavigationMenuTrigger
 * -------------------------------------------------------------------------- */

const navigationMenuTriggerVariants = tv({
  base: buttonVariants({
    className:
      "data-open:bg-secondary/50 data-open:text-secondary-foreground group/navigation-menu-trigger focus-visible:bg-secondary dark:hover:not-disabled:bg-secondary",
    variant: "ghost",
  }),
});

/* -----------------------------------------------------------------------------
 * Component: NavigationMenu
 * -------------------------------------------------------------------------- */

interface NavigationMenuProps extends ComponentProps<typeof NavigationMenuPrimitive.Root> {
  viewport?: boolean;
}

function NavigationMenu({
  children,
  className,
  viewport = true,
  ...props
}: NavigationMenuProps): JSX.Element {
  return (
    <NavigationMenuPrimitive.Root
      className={cn(
        "group/navigation-menu relative flex max-w-max flex-1 items-center justify-center",
        className,
      )}
      data-slot="navigation-menu"
      data-viewport={viewport}
      {...props}
    >
      {children}
      {viewport ? <NavigationMenuViewport /> : null}
    </NavigationMenuPrimitive.Root>
  );
}

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuList
 * -------------------------------------------------------------------------- */

type NavigationMenuListProps = ComponentProps<typeof NavigationMenuPrimitive.List>;

function NavigationMenuList({
  children,
  className,
  ...props
}: NavigationMenuListProps): JSX.Element {
  return (
    <NavigationMenuPrimitive.List
      className={cn("flex flex-1 list-none items-center justify-center gap-1", className)}
      data-slot="navigation-menu-list"
      {...props}
    >
      {children}
      <NavigationMenuIndicator className="invisible" />
    </NavigationMenuPrimitive.List>
  );
}

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuItem
 * -------------------------------------------------------------------------- */

type NavigationMenuItemProps = ComponentProps<typeof NavigationMenuPrimitive.Item>;

function NavigationMenuItem({ className, ...props }: NavigationMenuItemProps): JSX.Element {
  return (
    <NavigationMenuPrimitive.Item
      className={cn("group-data-[viewport=false]/navigation-menu:relative", className)}
      data-slot="navigation-menu-item"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuTrigger
 * -------------------------------------------------------------------------- */

type NavigationMenuTriggerProps = ComponentProps<typeof NavigationMenuPrimitive.Trigger>;

function NavigationMenuTrigger({
  children,
  className,
  ...props
}: NavigationMenuTriggerProps): JSX.Element {
  return (
    <NavigationMenuPrimitive.Trigger
      className={navigationMenuTriggerVariants({ className })}
      data-slot="navigation-menu-trigger"
      {...props}
    >
      {children}
      <ChevronDownIcon
        aria-hidden="true"
        className="relative top-px ml-1 size-3 transition duration-300 group-data-open/navigation-menu-trigger:rotate-180"
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
        "top-0 left-0 w-full ease-ui group-data-[viewport=false]/navigation-menu:top-full group-data-[viewport=false]/navigation-menu:mt-2 group-data-[viewport=false]/navigation-menu:overflow-hidden group-data-[viewport=false]/navigation-menu:rounded-lg group-data-[viewport=false]/navigation-menu:border group-data-[viewport=false]/navigation-menu:bg-popover group-data-[viewport=false]/navigation-menu:p-1 group-data-[viewport=false]/navigation-menu:text-popover-foreground group-data-[viewport=false]/navigation-menu:shadow group-data-[viewport=true]/navigation-menu:p-2 data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 data-[motion^=from-]:animate-in data-[motion^=from-]:fade-in-0 data-[motion^=to-]:animate-out data-[motion^=to-]:fade-out-0 md:absolute md:w-auto group-data-[viewport=false]/navigation-menu:data-open:animate-in group-data-[viewport=false]/navigation-menu:data-open:fade-in-0 group-data-[viewport=false]/navigation-menu:data-open:zoom-in-95 group-data-[viewport=false]/navigation-menu:data-closed:animate-out group-data-[viewport=false]/navigation-menu:data-closed:fade-out-0 group-data-[viewport=false]/navigation-menu:data-closed:zoom-out-95",
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

type NavigationMenuLinkProps = ComponentProps<typeof NavigationMenuPrimitive.Link>;

function NavigationMenuLink({ className, ...props }: NavigationMenuLinkProps): JSX.Element {
  return (
    <NavigationMenuPrimitive.Link
      className={cn(
        "flex flex-col gap-1 rounded-sm p-2 text-sm outline-hidden transition hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-active:bg-accent/50 data-active:text-accent-foreground data-active:hover:bg-accent data-active:focus:bg-accent [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground data-[variant=destructive]:[&_svg:not([class*='text-'])]:text-destructive/80",
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

type NavigationMenuViewportProps = ComponentProps<typeof NavigationMenuPrimitive.Viewport>;

function NavigationMenuViewport({ className, ...props }: NavigationMenuViewportProps): JSX.Element {
  return (
    <div className="absolute top-full left-0 z-30 flex justify-center perspective-distant">
      <NavigationMenuPrimitive.Viewport
        className={cn(
          "relative mt-2 min-h-[calc(var(--radix-navigation-menu-viewport-height)+2px)] w-full origin-[top_center] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg transition-[width,height] ease-ui sm:min-w-[calc(var(--radix-navigation-menu-viewport-width)+2px)] data-open:animate-in data-open:fade-in-0 data-open:zoom-in-90 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
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

type NavigationMenuIndicatorProps = ComponentProps<typeof NavigationMenuPrimitive.Indicator>;

function NavigationMenuIndicator({
  className,
  ...props
}: NavigationMenuIndicatorProps): JSX.Element {
  return (
    <NavigationMenuPrimitive.Indicator
      className={cn(
        "top-full z-10 flex h-2 items-center justify-center overflow-hidden ease-ui data-[state=hidden]:animate-out data-[state=hidden]:fade-out-0 data-[state=visible]:animate-in data-[state=visible]:fade-in-0",
        className,
      )}
      data-slot="navigation-menu-indicator"
      {...props}
    >
      <div className="relative top-[60%] size-2.5 rotate-45 rounded-tl-xs bg-popover text-popover-foreground" />
    </NavigationMenuPrimitive.Indicator>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { navigationMenuTriggerVariants };
export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
};

export type {
  NavigationMenuContentProps,
  NavigationMenuItemProps,
  NavigationMenuLinkProps,
  NavigationMenuListProps,
  NavigationMenuProps,
  NavigationMenuTriggerProps,
};
