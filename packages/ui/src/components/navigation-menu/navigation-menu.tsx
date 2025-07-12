"use client";

import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";
import { ChevronDownIcon } from "lucide-react";

import { navigationMenuTriggerStyle } from "@/components/navigation-menu/navigation-menu-trigger.style";
import { cn } from "@/lib/utils";

import type { ComponentProps, JSX } from "react";

/* -----------------------------------------------------------------------------
 * Component: NavigationMenu
 * -------------------------------------------------------------------------- */

function NavigationMenu({
  children,
  className,
  viewport = true,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Root> & {
  viewport?: boolean;
}): JSX.Element {
  return (
    <NavigationMenuPrimitive.Root
      className={cn("group/navigation-menu relative flex max-w-max flex-1 items-center justify-center", className)}
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

function NavigationMenuList({
  children,
  className,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.List>): JSX.Element {
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

function NavigationMenuItem({ className, ...props }: ComponentProps<typeof NavigationMenuPrimitive.Item>): JSX.Element {
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

function NavigationMenuTrigger({
  children,
  className,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Trigger>): JSX.Element {
  return (
    <NavigationMenuPrimitive.Trigger
      className={navigationMenuTriggerStyle({ className })}
      data-slot="navigation-menu-trigger"
      {...props}
    >
      {children}
      <ChevronDownIcon
        aria-hidden="true"
        className="relative top-px ml-1 size-3 transition duration-300 group-data-[state=open]/navigation-menu-trigger:rotate-180"
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
        "data-[motion^=from-]:animate-in data-[motion^=from-]:fade-in-0 data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion^=to-]:animate-out data-[motion^=to-]:fade-out-0 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 group-data-[viewport=false]/navigation-menu:bg-popover group-data-[viewport=false]/navigation-menu:text-popover-foreground group-data-[viewport=false]/navigation-menu:data-[state=open]:animate-in group-data-[viewport=false]/navigation-menu:data-[state=closed]:animate-out group-data-[viewport=false]/navigation-menu:data-[state=closed]:zoom-out-95 group-data-[viewport=false]/navigation-menu:data-[state=open]:zoom-in-95 group-data-[viewport=false]/navigation-menu:data-[state=open]:fade-in-0 group-data-[viewport=false]/navigation-menu:data-[state=closed]:fade-out-0 left-0 top-0 w-full group-data-[viewport=false]/navigation-menu:top-full group-data-[viewport=false]/navigation-menu:mt-2 group-data-[viewport=false]/navigation-menu:overflow-hidden group-data-[viewport=false]/navigation-menu:rounded-lg group-data-[viewport=false]/navigation-menu:border group-data-[viewport=false]/navigation-menu:p-1 group-data-[viewport=true]/navigation-menu:p-2 group-data-[viewport=false]/navigation-menu:shadow md:absolute md:w-auto",
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
        "data-[active=true]:focus:bg-accent data-[active=true]:hover:bg-accent data-[active=true]:bg-accent/50 data-[active=true]:text-accent-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:[&_svg:not([class*='text-'])]:text-destructive/80 [&_svg:not([class*='text-'])]:text-muted-foreground outline-hidden flex flex-col gap-1 rounded-sm p-2 text-sm transition [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
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
    <div className="perspective-distant absolute left-0 top-full z-30 flex justify-center">
      <NavigationMenuPrimitive.Viewport
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-90 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 relative mt-2 min-h-[calc(var(--radix-navigation-menu-viewport-height)+2px)] w-full origin-[top_center] overflow-hidden rounded-lg border shadow-lg transition-[width,height] sm:min-w-[calc(var(--radix-navigation-menu-viewport-width)+2px)]",
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
        "data-[state=visible]:animate-fade-in data-[state=hidden]:animate-fade-out top-full z-10 flex h-2 items-center justify-center overflow-hidden",
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
