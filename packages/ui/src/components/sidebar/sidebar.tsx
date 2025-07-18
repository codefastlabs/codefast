"use client";

import { PanelLeftIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentProps, CSSProperties, Dispatch, JSX, SetStateAction } from "react";

import type { VariantProps } from "@/lib/utils";

import { Button } from "@/components/button/button";
import { Input } from "@/components/input/input";
import { Separator } from "@/components/separator/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/sheet/sheet";
import { sidebarMenuButtonVariants } from "@/components/sidebar/sidebar-menu-button.variants";
import { Skeleton } from "@/components/skeleton/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/tooltip/tooltip";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@codefast/hooks";
import { createContext } from "@radix-ui/react-context";
import { Slot } from "@radix-ui/react-slot";

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3.0625rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

interface SidebarContextValue {
  isMobile: boolean;
  open: boolean;
  openMobile: boolean;
  setOpen: (open: boolean) => void;
  setOpenMobile: Dispatch<SetStateAction<boolean>>;
  state: "collapsed" | "expanded";
  toggleSidebar: () => void;
}

/* -----------------------------------------------------------------------------
 * Context: SidebarProvider
 * -------------------------------------------------------------------------- */

const SIDEBAR_PROVIDER_NAME = "SidebarProvider";

const [SidebarContextProvider, useSidebar] =
  createContext<SidebarContextValue>(SIDEBAR_PROVIDER_NAME);

/* -----------------------------------------------------------------------------
 * Component: SidebarProvider
 * -------------------------------------------------------------------------- */

interface SidebarProviderProps extends ComponentProps<"div"> {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}

function SidebarProvider({
  children,
  className,
  defaultOpen = true,
  onOpenChange: setOpenProperty,
  open: openProperty,
  style,
  ...props
}: SidebarProviderProps): JSX.Element {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = useState(false);

  // This is the internal state of the sidebar.
  // We use openProp and setOpenProp for control from outside the component.
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const open = openProperty ?? isOpen;
  const setOpen = useCallback(
    (value: ((value: boolean) => boolean) | boolean) => {
      const openState = typeof value === "function" ? value(open) : value;

      if (setOpenProperty) {
        setOpenProperty(openState);
      } else {
        setIsOpen(openState);
      }

      // eslint-disable-next-line unicorn/no-document-cookie
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${String(openState)}; path=/; max-age=${String(
        SIDEBAR_COOKIE_MAX_AGE,
      )}`;
    },
    [setOpenProperty, open],
  );

  // Helper to toggle the sidebar.
  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setOpenMobile((currentValue) => !currentValue);
    } else {
      setOpen((currentValue) => !currentValue);
    }
  }, [isMobile, setOpen]);

  // Adds a keyboard shortcut to toggle the sidebar.
  useEffect(() => {
    const handleKeyDown: (event: KeyboardEvent) => void = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    globalThis.addEventListener("keydown", handleKeyDown);

    return (): void => {
      globalThis.removeEventListener("keydown", handleKeyDown);
    };
  }, [toggleSidebar]);

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? "expanded" : "collapsed";

  return (
    <SidebarContextProvider
      isMobile={isMobile}
      open={open}
      openMobile={openMobile}
      setOpen={setOpen}
      setOpenMobile={setOpenMobile}
      state={state}
      toggleSidebar={toggleSidebar}
    >
      <TooltipProvider delayDuration={0}>
        <div
          className={cn(
            "group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full",
            className,
          )}
          data-slot="sidebar-wrapper"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            } as CSSProperties
          }
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContextProvider>
  );
}

/* -----------------------------------------------------------------------------
 * Component: Sidebar
 * -------------------------------------------------------------------------- */

const SIDEBAR_NAME = "Sidebar";

interface SidebarProps extends ComponentProps<"div"> {
  collapsible?: "icon" | "none" | "offcanvas";
  side?: "left" | "right";
  variant?: "floating" | "inset" | "sidebar";
}

function Sidebar({
  children,
  className,
  collapsible = "offcanvas",
  side = "left",
  variant = "sidebar",
  ...props
}: SidebarProps): JSX.Element {
  const { isMobile, openMobile, setOpenMobile, state } = useSidebar(SIDEBAR_NAME);

  if (collapsible === "none") {
    return (
      <div
        className={cn(
          "bg-sidebar text-sidebar-foreground w-(--sidebar-width) flex h-full flex-col",
          className,
        )}
        data-slot="sidebar"
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          className="bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden"
          data-mobile="true"
          data-sidebar="sidebar"
          data-slot="sidebar"
          side={side}
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as CSSProperties
          }
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className={cn("text-sidebar-foreground group peer hidden md:block", className)}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-side={side}
      data-slot="sidebar"
      data-state={state}
      data-variant={variant}
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div
        className={cn(
          "w-(--sidebar-width) relative bg-transparent transition-[width] duration-200 ease-linear group-data-[collapsible=offcanvas]:w-0 group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
        )}
        data-slot="sidebar-gap"
      />
      <div
        className={cn(
          "w-(--sidebar-width) fixed inset-y-0 z-10 hidden h-svh transition-[left,right,width] duration-200 ease-linear md:flex",
          side === "left"
            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
          // Adjust the padding for floating and inset variants.
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
          className,
        )}
        data-slot="sidebar-container"
        {...props}
      >
        <div
          className="bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm"
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarTrigger
 * -------------------------------------------------------------------------- */

const SIDEBAR_TRIGGER_NAME = "SidebarTrigger";

type SidebarTriggerProps = ComponentProps<typeof Button>;

function SidebarTrigger({ className, onClick, ...props }: SidebarTriggerProps): JSX.Element {
  const { toggleSidebar } = useSidebar(SIDEBAR_TRIGGER_NAME);

  return (
    <Button
      className={cn("size-7", className)}
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      size="icon"
      variant="ghost"
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeftIcon />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarRail
 * -------------------------------------------------------------------------- */

const SIDEBAR_RAIL_NAME = "SidebarRail";

type SidebarRailProps = ComponentProps<"button">;

function SidebarRail({ className, ...props }: SidebarRailProps): JSX.Element {
  const { toggleSidebar } = useSidebar(SIDEBAR_RAIL_NAME);

  return (
    <button
      className={cn(
        "hover:after:bg-sidebar-border in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize hover:group-data-[collapsible=offcanvas]:bg-sidebar absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] group-data-[side=left]:-right-4 group-data-[side=right]:left-0 group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full sm:flex [[data-side=left][data-collapsible=offcanvas]_&]:-right-2 [[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-collapsible=offcanvas]_&]:-left-2 [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        className,
      )}
      data-sidebar="rail"
      data-slot="sidebar-rail"
      title="Toggle Sidebar"
      type="button"
      onClick={toggleSidebar}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarInset
 * -------------------------------------------------------------------------- */

type SidebarInsetProps = ComponentProps<"main">;

function SidebarInset({ className, ...props }: SidebarInsetProps): JSX.Element {
  return (
    <main
      className={cn(
        "bg-background relative flex w-full min-w-0 flex-1 flex-col md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm",
        className,
      )}
      data-slot="sidebar-inset"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarInput
 * -------------------------------------------------------------------------- */

type SidebarInputProps = ComponentProps<typeof Input>;

function SidebarInput({ className, ...props }: SidebarInputProps): JSX.Element {
  return (
    <Input
      className={cn("bg-background h-8 w-full shadow-none", className)}
      data-sidebar="input"
      data-slot="sidebar-input"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarHeader
 * -------------------------------------------------------------------------- */

type SidebarHeaderProps = ComponentProps<"div">;

function SidebarHeader({ className, ...props }: SidebarHeaderProps): JSX.Element {
  return (
    <div
      className={cn("flex flex-col gap-2 p-2", className)}
      data-sidebar="header"
      data-slot="sidebar-header"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarFooter
 * -------------------------------------------------------------------------- */

type SidebarFooterProps = ComponentProps<"div">;

function SidebarFooter({ className, ...props }: SidebarFooterProps): JSX.Element {
  return (
    <div
      className={cn("flex flex-col gap-2 p-2", className)}
      data-sidebar="footer"
      data-slot="sidebar-footer"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarSeparator
 * -------------------------------------------------------------------------- */

type SidebarSeparatorProps = ComponentProps<typeof Separator>;

function SidebarSeparator({ className, ...props }: SidebarSeparatorProps): JSX.Element {
  return (
    <Separator
      className={cn("bg-sidebar-border mx-2 w-auto", className)}
      data-sidebar="separator"
      data-slot="sidebar-separator"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarContent
 * -------------------------------------------------------------------------- */

type SidebarContentProps = ComponentProps<"div">;

function SidebarContent({ className, ...props }: SidebarContentProps): JSX.Element {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className,
      )}
      data-sidebar="content"
      data-slot="sidebar-content"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarGroup
 * -------------------------------------------------------------------------- */

type SidebarGroupProps = ComponentProps<"div">;

function SidebarGroup({ className, ...props }: SidebarGroupProps): JSX.Element {
  return (
    <div
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      data-sidebar="group"
      data-slot="sidebar-group"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarGroupLabel
 * -------------------------------------------------------------------------- */

interface SidebarGroupLabelProps extends ComponentProps<"div"> {
  asChild?: boolean;
}

function SidebarGroupLabel({
  asChild = false,
  className,
  ...props
}: SidebarGroupLabelProps): JSX.Element {
  const Component = asChild ? Slot : "div";

  return (
    <Component
      className={cn(
        "text-sidebar-foreground/70 ring-sidebar-ring outline-hidden focus-visible:ring-3 flex h-8 shrink-0 items-center truncate rounded-md px-2 text-xs font-medium transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 [&>svg]:size-4 [&>svg]:shrink-0",
        className,
      )}
      data-sidebar="group-label"
      data-slot="sidebar-group-label"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarGroupAction
 * -------------------------------------------------------------------------- */

interface SidebarGroupActionProps extends ComponentProps<"button"> {
  asChild?: boolean;
}

function SidebarGroupAction({
  asChild = false,
  className,
  ...props
}: SidebarGroupActionProps): JSX.Element {
  const Component = asChild ? Slot : "button";

  return (
    <Component
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground outline-hidden focus-visible:ring-3 absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 transition-transform after:absolute after:-inset-2 group-data-[collapsible=icon]:hidden md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0",
        className,
      )}
      data-sidebar="group-action"
      data-slot="sidebar-group-action"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarGroupContent
 * -------------------------------------------------------------------------- */

type SidebarGroupContentProps = ComponentProps<"div">;

function SidebarGroupContent({ className, ...props }: SidebarGroupContentProps): JSX.Element {
  return (
    <div
      className={cn("w-full text-sm", className)}
      data-sidebar="group-content"
      data-slot="sidebar-group-content"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarMenu
 * -------------------------------------------------------------------------- */

type SidebarMenuProps = ComponentProps<"ul">;

function SidebarMenu({ className, ...props }: SidebarMenuProps): JSX.Element {
  return (
    <ul
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      data-sidebar="menu"
      data-slot="sidebar-menu"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarMenuItem
 * -------------------------------------------------------------------------- */

type SidebarMenuItemProps = ComponentProps<"li">;

function SidebarMenuItem({ className, ...props }: SidebarMenuItemProps): JSX.Element {
  return (
    <li
      className={cn("group/menu-item relative", className)}
      data-sidebar="menu-item"
      data-slot="sidebar-menu-item"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarMenuButton
 * -------------------------------------------------------------------------- */

const SIDEBAR_MENU_BUTTON_NAME = "SidebarMenuButton";

interface SidebarMenuButtonProps
  extends ComponentProps<"button">,
    VariantProps<typeof sidebarMenuButtonVariants> {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: ComponentProps<typeof TooltipContent> | string;
}

function SidebarMenuButton({
  asChild = false,
  className,
  isActive = false,
  size = "md",
  tooltip,
  variant = "default",
  ...props
}: SidebarMenuButtonProps): JSX.Element {
  const Component = asChild ? Slot : "button";
  const { isMobile, state } = useSidebar(SIDEBAR_MENU_BUTTON_NAME);

  const button = (
    <Component
      className={cn(sidebarMenuButtonVariants({ size, variant }), className)}
      data-active={isActive}
      data-sidebar="menu-button"
      data-size={size}
      data-slot="sidebar-menu-button"
      {...props}
    />
  );

  if (!tooltip) {
    return button;
  }

  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    };
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        align="center"
        hidden={state !== "collapsed" || isMobile}
        side="right"
        {...tooltip}
      />
    </Tooltip>
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarMenuAction
 * -------------------------------------------------------------------------- */

interface SidebarMenuActionProps extends ComponentProps<"button"> {
  asChild?: boolean;
  showOnHover?: boolean;
}

function SidebarMenuAction({
  asChild = false,
  className,
  showOnHover = false,
  ...props
}: SidebarMenuActionProps): JSX.Element {
  const Component = asChild ? Slot : "button";

  return (
    <Component
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground peer-hover/menu-button:text-sidebar-accent-foreground outline-hidden focus-visible:ring-3 absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 transition-transform after:absolute after:-inset-2 group-data-[collapsible=icon]:hidden peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0",
        showOnHover &&
          "peer-data-[active=true]/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0",
        className,
      )}
      data-sidebar="menu-action"
      data-slot="sidebar-menu-action"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarMenuBadge
 * -------------------------------------------------------------------------- */

type SidebarMenuBadgeProps = ComponentProps<"div">;

function SidebarMenuBadge({ className, ...props }: SidebarMenuBadgeProps): JSX.Element {
  return (
    <div
      className={cn(
        "text-sidebar-foreground peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground pointer-events-none absolute right-1 flex h-5 min-w-5 select-none items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums group-data-[collapsible=icon]:hidden peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1",
        className,
      )}
      data-sidebar="menu-badge"
      data-slot="sidebar-menu-badge"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarMenuSkeleton
 * -------------------------------------------------------------------------- */

interface SidebarMenuSkeletonProps extends ComponentProps<"div"> {
  showIcon?: boolean;
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: SidebarMenuSkeletonProps): JSX.Element {
  // Random width between 50 to 90%.
  const width = useMemo(() => {
    return `${String(Math.floor(Math.random() * 40) + 50)}%`;
  }, []);

  return (
    <div
      className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
      data-sidebar="menu-skeleton"
      data-slot="sidebar-menu-skeleton"
      {...props}
    >
      {showIcon ? (
        <Skeleton className="size-4 rounded-md" data-sidebar="menu-skeleton-icon" />
      ) : null}
      <Skeleton
        className="max-w-(--skeleton-width) h-4 flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as CSSProperties
        }
      />
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarMenuSub
 * -------------------------------------------------------------------------- */

type SidebarMenuSubProps = ComponentProps<"ul">;

function SidebarMenuSub({ className, ...props }: SidebarMenuSubProps): JSX.Element {
  return (
    <ul
      className={cn(
        "border-sidebar-border mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5 group-data-[collapsible=icon]:hidden",
        className,
      )}
      data-sidebar="menu-sub"
      data-slot="sidebar-menu-sub"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarMenuSubItem
 * -------------------------------------------------------------------------- */

type SidebarMenuSubItemProps = ComponentProps<"li">;

function SidebarMenuSubItem({ className, ...props }: SidebarMenuSubItemProps): JSX.Element {
  return (
    <li
      className={cn("group/menu-sub-item relative", className)}
      data-sidebar="menu-sub-item"
      data-slot="sidebar-menu-sub-item"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarMenuSubButton
 * -------------------------------------------------------------------------- */

interface SidebarMenuSubButtonProps extends ComponentProps<"a"> {
  asChild?: boolean;
  isActive?: boolean;
  size?: "md" | "sm";
}

function SidebarMenuSubButton({
  asChild = false,
  className,
  isActive = false,
  size = "md",
  ...props
}: SidebarMenuSubButtonProps): JSX.Element {
  const Component = asChild ? Slot : "a";

  return (
    <Component
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground outline-hidden focus-visible:ring-3 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      data-active={isActive}
      data-sidebar="menu-sub-button"
      data-size={size}
      data-slot="sidebar-menu-sub-button"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};
export type {
  SidebarContentProps,
  SidebarFooterProps,
  SidebarGroupActionProps,
  SidebarGroupContentProps,
  SidebarGroupLabelProps,
  SidebarGroupProps,
  SidebarHeaderProps,
  SidebarInputProps,
  SidebarInsetProps,
  SidebarMenuActionProps,
  SidebarMenuBadgeProps,
  SidebarMenuButtonProps,
  SidebarMenuItemProps,
  SidebarMenuProps,
  SidebarMenuSkeletonProps,
  SidebarMenuSubButtonProps,
  SidebarMenuSubItemProps,
  SidebarMenuSubProps,
  SidebarProps,
  SidebarProviderProps,
  SidebarRailProps,
  SidebarSeparatorProps,
  SidebarTriggerProps,
};
