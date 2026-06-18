import { ChevronDownIcon } from "lucide-react";
import { NavigationMenu as NavigationMenuPrimitive } from "radix-ui";
import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import { navigationMenuTriggerVariants } from "#/variants/navigation-menu";

/* -----------------------------------------------------------------------------
 * Component: NavigationMenu
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface NavigationMenuProps extends ComponentProps<typeof NavigationMenuPrimitive.Root> {
  viewport?: boolean;
}

/**
 * @since 0.3.16-canary.0
 */
function NavigationMenu({ children, className, viewport = true, ...props }: NavigationMenuProps): JSX.Element {
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

/**
 * @since 0.3.16-canary.0
 */
type NavigationMenuListProps = ComponentProps<typeof NavigationMenuPrimitive.List>;

/**
 * @since 0.3.16-canary.0
 */
function NavigationMenuList({ children, className, ...props }: NavigationMenuListProps): JSX.Element {
  return (
    <NavigationMenuPrimitive.List
      className={cn("group flex flex-1 list-none items-center justify-center gap-0", className)}
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

/**
 * @since 0.3.16-canary.0
 */
type NavigationMenuItemProps = ComponentProps<typeof NavigationMenuPrimitive.Item>;

/**
 * @since 0.3.16-canary.0
 */
function NavigationMenuItem({ className, ...props }: NavigationMenuItemProps): JSX.Element {
  return (
    <NavigationMenuPrimitive.Item className={cn("relative", className)} data-slot="navigation-menu-item" {...props} />
  );
}

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuTrigger
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type NavigationMenuTriggerProps = ComponentProps<typeof NavigationMenuPrimitive.Trigger>;

/**
 * @since 0.3.16-canary.0
 */
function NavigationMenuTrigger({ children, className, ...props }: NavigationMenuTriggerProps): JSX.Element {
  return (
    <NavigationMenuPrimitive.Trigger
      className={navigationMenuTriggerVariants({ className: ["group", className] })}
      data-slot="navigation-menu-trigger"
      {...props}
    >
      {children}{" "}
      <ChevronDownIcon
        aria-hidden="true"
        className="relative top-px ms-1 size-3 transition duration-300 group-data-popup-open/navigation-menu-trigger:rotate-180 group-data-open/navigation-menu-trigger:rotate-180"
      />
    </NavigationMenuPrimitive.Trigger>
  );
}

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuContent
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type NavigationMenuContentProps = ComponentProps<typeof NavigationMenuPrimitive.Content>;

/**
 * @since 0.3.16-canary.0
 */
function NavigationMenuContent({ className, ...props }: NavigationMenuContentProps): JSX.Element {
  return (
    <NavigationMenuPrimitive.Content
      className={cn(
        "inset-s-0 top-0 w-full p-2 pe-2.5 ease-snappy group-data-[viewport=false]/navigation-menu:top-full group-data-[viewport=false]/navigation-menu:mt-1.5 group-data-[viewport=false]/navigation-menu:overflow-hidden group-data-[viewport=false]/navigation-menu:rounded-md group-data-[viewport=false]/navigation-menu:bg-popover group-data-[viewport=false]/navigation-menu:text-popover-foreground group-data-[viewport=false]/navigation-menu:shadow group-data-[viewport=false]/navigation-menu:ring-1 group-data-[viewport=false]/navigation-menu:ring-foreground/10 group-data-[viewport=false]/navigation-menu:animation-duration-300 data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 data-[motion^=from-]:animate-in data-[motion^=from-]:fade-in data-[motion^=to-]:animate-out data-[motion^=to-]:ease-exit data-[motion^=to-]:fade-out **:data-[slot=navigation-menu-link]:focus:ring-0 **:data-[slot=navigation-menu-link]:focus:outline-none md:absolute md:w-auto group-data-[viewport=false]/navigation-menu:data-open:animate-in group-data-[viewport=false]/navigation-menu:data-open:fade-in-0 group-data-[viewport=false]/navigation-menu:data-open:zoom-in-95 data-closed:ease-exit group-data-[viewport=false]/navigation-menu:data-closed:animate-out group-data-[viewport=false]/navigation-menu:data-closed:fade-out-0 group-data-[viewport=false]/navigation-menu:data-closed:zoom-out-95",
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

/**
 * @since 0.3.16-canary.0
 */
type NavigationMenuLinkProps = ComponentProps<typeof NavigationMenuPrimitive.Link>;

/**
 * @since 0.3.16-canary.0
 */
function NavigationMenuLink({ className, ...props }: NavigationMenuLinkProps): JSX.Element {
  return (
    <NavigationMenuPrimitive.Link
      className={cn(
        "flex items-center gap-1.5 rounded-md p-2 text-sm transition-all outline-none hover:bg-muted focus:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-1 data-[active=true]:bg-muted/50 data-[active=true]:hover:bg-muted data-[active=true]:focus:bg-muted [&_svg:not([class*='size-'])]:size-4",
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

/**
 * @since 0.4.0-canary.4
 */
type NavigationMenuViewportProps = ComponentProps<typeof NavigationMenuPrimitive.Viewport>;

/**
 * @since 0.4.0-canary.4
 */
function NavigationMenuViewport({ className, ...props }: NavigationMenuViewportProps): JSX.Element {
  return (
    <div className="absolute inset-s-0 top-full isolate z-50 flex justify-center">
      <NavigationMenuPrimitive.Viewport
        className={cn(
          "relative mt-1.5 h-(--radix-navigation-menu-viewport-height) w-full origin-[top_center] overflow-hidden rounded-lg bg-popover text-popover-foreground shadow ring-1 ring-foreground/10 transition-[width,height] duration-100 ease-snappy md:w-(--radix-navigation-menu-viewport-width) data-open:animate-in data-open:animation-duration-100 data-open:zoom-in-90 data-closed:animate-out data-closed:ease-exit data-closed:animation-duration-100 data-closed:zoom-out-90",
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

/**
 * @since 0.4.0-canary.4
 */
type NavigationMenuIndicatorProps = ComponentProps<typeof NavigationMenuPrimitive.Indicator>;

/**
 * @since 0.4.0-canary.4
 */
function NavigationMenuIndicator({ className, ...props }: NavigationMenuIndicatorProps): JSX.Element {
  return (
    <NavigationMenuPrimitive.Indicator
      className={cn(
        "top-full z-1 flex h-1.5 items-end justify-center overflow-hidden data-hidden:animate-out data-hidden:fade-out data-visible:animate-in data-visible:fade-in",
        className,
      )}
      data-slot="navigation-menu-indicator"
      {...props}
    >
      <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-ss-sm bg-border shadow-md" />
    </NavigationMenuPrimitive.Indicator>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
};

export type {
  NavigationMenuContentProps,
  NavigationMenuIndicatorProps,
  NavigationMenuItemProps,
  NavigationMenuLinkProps,
  NavigationMenuListProps,
  NavigationMenuProps,
  NavigationMenuTriggerProps,
  NavigationMenuViewportProps,
};
