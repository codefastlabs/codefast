'use client';

import * as React from 'react';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu';
import { navigationMenuVariants } from '@/styles/navigation-menu-variants';

/* -----------------------------------------------------------------------------
 * Variant: NavigationMenu
 * -------------------------------------------------------------------------- */

const { root, list, trigger, triggerIcon, content, viewport, viewportWrapper, indicator, indicatorIcon } =
  navigationMenuVariants();

/* -----------------------------------------------------------------------------
 * Component: NavigationMenu
 * -------------------------------------------------------------------------- */

type NavigationMenuElement = React.ElementRef<typeof NavigationMenuPrimitive.Root>;
type NavigationMenuProps = React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>;

const NavigationMenu = React.forwardRef<NavigationMenuElement, NavigationMenuProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <NavigationMenuPrimitive.Root ref={forwardedRef} className={root({ className })} {...props}>
      {children}
      <NavigationMenuViewport />
    </NavigationMenuPrimitive.Root>
  ),
);

NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuList
 * -------------------------------------------------------------------------- */

type NavigationMenuListElement = React.ElementRef<typeof NavigationMenuPrimitive.List>;
type NavigationMenuListProps = React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>;

const NavigationMenuList = React.forwardRef<NavigationMenuListElement, NavigationMenuListProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <NavigationMenuPrimitive.List ref={forwardedRef} className={list({ className })} {...props}>
      {children}
      <NavigationMenuIndicator />
    </NavigationMenuPrimitive.List>
  ),
);

NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName;

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuItem
 * -------------------------------------------------------------------------- */

type NavigationMenuItemProps = React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Item>;

const NavigationMenuItem = NavigationMenuPrimitive.Item;

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuContent
 * -------------------------------------------------------------------------- */

type NavigationMenuTriggerElement = React.ElementRef<typeof NavigationMenuPrimitive.Trigger>;
type NavigationMenuTriggerProps = React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>;

const NavigationMenuTrigger = React.forwardRef<NavigationMenuTriggerElement, NavigationMenuTriggerProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <NavigationMenuPrimitive.Trigger
      ref={forwardedRef}
      className={trigger({ className: ['group', className] })}
      {...props}
    >
      {children}
      <ChevronDownIcon aria-hidden="true" className={triggerIcon()} />
    </NavigationMenuPrimitive.Trigger>
  ),
);

NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName;

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuContent
 * -------------------------------------------------------------------------- */

type NavigationMenuContentElement = React.ElementRef<typeof NavigationMenuPrimitive.Content>;
type NavigationMenuContentProps = React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>;

const NavigationMenuContent = React.forwardRef<NavigationMenuContentElement, NavigationMenuContentProps>(
  ({ className, ...props }, forwardedRef) => (
    <NavigationMenuPrimitive.Content ref={forwardedRef} className={content({ className })} {...props} />
  ),
);

NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName;

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuLink
 * -------------------------------------------------------------------------- */

type NavigationMenuLinkProps = React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Link>;

const NavigationMenuLink = NavigationMenuPrimitive.Link;

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuViewport
 * -------------------------------------------------------------------------- */

type NavigationMenuViewportElement = React.ElementRef<typeof NavigationMenuPrimitive.Viewport>;
type NavigationMenuViewportProps = React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>;

const NavigationMenuViewport = React.forwardRef<NavigationMenuViewportElement, NavigationMenuViewportProps>(
  ({ className, ...props }, forwardedRef) => (
    <div className={viewportWrapper()}>
      <NavigationMenuPrimitive.Viewport ref={forwardedRef} className={viewport({ className })} {...props} />
    </div>
  ),
);

NavigationMenuViewport.displayName = NavigationMenuPrimitive.Viewport.displayName;

/* -----------------------------------------------------------------------------
 * Component: NavigationMenuIndicator
 * -------------------------------------------------------------------------- */

type NavigationMenuIndicatorElement = React.ElementRef<typeof NavigationMenuPrimitive.Indicator>;
type NavigationMenuIndicatorProps = React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>;

const NavigationMenuIndicator = React.forwardRef<NavigationMenuIndicatorElement, NavigationMenuIndicatorProps>(
  ({ className, ...props }, forwardedRef) => (
    <NavigationMenuPrimitive.Indicator ref={forwardedRef} className={indicator({ className })} {...props}>
      <div className={indicatorIcon()} />
    </NavigationMenuPrimitive.Indicator>
  ),
);

NavigationMenuIndicator.displayName = NavigationMenuPrimitive.Indicator.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  type NavigationMenuProps,
  type NavigationMenuListProps,
  type NavigationMenuItemProps,
  type NavigationMenuContentProps,
  type NavigationMenuTriggerProps,
  type NavigationMenuLinkProps,
};
