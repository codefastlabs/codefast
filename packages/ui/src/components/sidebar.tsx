'use client';

import type { ComponentProps, CSSProperties, JSX } from 'react';
import type { VariantProps } from 'tailwind-variants';

import { useMediaQuery } from '@codefast/hooks';
import { Slot } from '@radix-ui/react-slot';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { PanelLeftIcon } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { tv } from 'tailwind-variants';

import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Separator } from '@/components/separator';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/sheet';
import { Skeleton } from '@/components/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/tooltip';
import { cn } from '@/lib/utils';

const SIDEBAR_COOKIE_NAME = 'sidebar:state';
const SIDEBAR_COOKIE_MAX_AGE = 7; // 1 week in days.
const SIDEBAR_WIDTH = '16rem';
const SIDEBAR_WIDTH_MOBILE = '18rem';
const SIDEBAR_WIDTH_ICON = '3rem';
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';
const SIDEBAR_MOBILE_BREAKPOINT = 768;

interface SidebarContext {
  isMobile: boolean;
  open: boolean;
  openMobile: boolean;
  setOpen: (open: boolean) => void;
  setOpenMobile: (open: boolean) => void;
  state: 'collapsed' | 'expanded';
  toggleSidebar: () => void;
}

const SidebarContext = createContext<null | SidebarContext>(null);

function useSidebar(): SidebarContext {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }

  return context;
}

/* -----------------------------------------------------------------------------
 * Component: SidebarProvider
 * -------------------------------------------------------------------------- */

interface SidebarProviderProps extends ComponentProps<'div'> {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}

function SidebarProvider({
  children,
  className,
  defaultOpen = true,
  onOpenChange: setOpenProp,
  open: openProp,
  style,
  ...props
}: SidebarProviderProps): JSX.Element {
  const isMobile = useMediaQuery(`(max-width: ${SIDEBAR_MOBILE_BREAKPOINT - 1}px)`);
  const [openMobile, setOpenMobile] = useState(false);

  // This is the internal state of the sidebar.
  // We use openProp and setOpenProp for control from outside the component.
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const open = openProp ?? isOpen;
  const setOpen = useCallback(
    (value: ((value: boolean) => boolean) | boolean) => {
      const openState = typeof value === 'function' ? value(open) : value;

      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        setIsOpen(openState);
      }

      // eslint-disable-next-line unicorn/no-document-cookie -- This sets the cookie to keep the sidebar state.
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open],
  );

  // Helper to toggle the sidebar.
  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setOpenMobile((currentValue) => !currentValue);
    } else {
      setOpen((currentValue) => !currentValue);
    }
  }, [isMobile, setOpen, setOpenMobile]);

  // Adds a keyboard shortcut to toggle the sidebar.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleSidebar]);

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? 'expanded' : 'collapsed';

  const contextValue = useMemo<SidebarContext>(
    () => ({
      isMobile,
      open,
      openMobile,
      setOpen,
      setOpenMobile,
      state,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          className={cn('group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full', className)}
          style={
            {
              '--sidebar-width': SIDEBAR_WIDTH,
              '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
              ...style,
            } as CSSProperties
          }
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}

/* -----------------------------------------------------------------------------
 * Component: Sidebar
 * -------------------------------------------------------------------------- */

interface SidebarProps extends ComponentProps<'div'> {
  collapsible?: 'icon' | 'none' | 'offcanvas';
  side?: 'left' | 'right';
  variant?: 'floating' | 'inset' | 'sidebar';
}

function Sidebar({
  children,
  className,
  collapsible = 'offcanvas',
  side = 'left',
  variant = 'sidebar',
  ...props
}: SidebarProps): JSX.Element {
  const { isMobile, openMobile, setOpenMobile, state } = useSidebar();

  if (collapsible === 'none') {
    return (
      <div
        className={cn('bg-sidebar text-sidebar-foreground w-(--sidebar-width) flex h-full flex-col', className)}
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
          side={side}
          style={
            {
              '--sidebar-width': SIDEBAR_WIDTH_MOBILE,
            } as CSSProperties
          }
        >
          <VisuallyHidden>
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Press escape to close the sidebar</SheetDescription>
          </VisuallyHidden>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className="text-sidebar-foreground group peer hidden md:block"
      data-collapsible={state === 'collapsed' ? collapsible : ''}
      data-side={side}
      data-state={state}
      data-variant={variant}
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div
        className={cn(
          'w-(--sidebar-width) relative h-svh bg-transparent transition-[width] duration-200 ease-linear group-data-[collapsible=offcanvas]:w-0 group-data-[side=right]:rotate-180',
          variant === 'floating' || variant === 'inset'
            ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]'
            : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)',
        )}
      />
      <div
        className={cn(
          'w-(--sidebar-width) fixed inset-y-0 z-10 hidden h-svh transition-[left,right,width] duration-200 ease-linear md:flex',
          side === 'left'
            ? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
            : 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
          variant === 'floating' || variant === 'inset'
            ? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]'
            : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l',
          className,
        )}
        {...props}
      >
        <div
          className="bg-sidebar group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow-xs flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border"
          data-sidebar="sidebar"
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

type SidebarTriggerProps = ComponentProps<typeof Button>;

function SidebarTrigger({ className, onClick, ...props }: SidebarTriggerProps): JSX.Element {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      icon
      className={cn('', className)}
      data-sidebar="trigger"
      size="2xs"
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

type SidebarRailProps = ComponentProps<'button'>;

function SidebarRail({ className, ...props }: SidebarRailProps): JSX.Element {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      aria-label="Toggle Sidebar"
      className={cn(
        'hover:after:bg-sidebar-border group-data-[collapsible=offcanvas]:hover:bg-sidebar absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 group-data-[side=left]:-right-4 group-data-[side=right]:left-0 group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full sm:flex [[data-side=left][data-collapsible=offcanvas]_&]:-right-2 [[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=left]_&]:cursor-w-resize [[data-side=right][data-collapsible=offcanvas]_&]:-left-2 [[data-side=right][data-state=collapsed]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize',
        className,
      )}
      data-sidebar="rail"
      tabIndex={-1}
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

type SidebarInsetProps = ComponentProps<'main'>;

function SidebarInset({ className, ...props }: SidebarInsetProps): JSX.Element {
  return (
    <main
      className={cn(
        'bg-background md:peer-data-[variant=inset]:shadow-xs relative flex min-h-svh flex-1 flex-col peer-data-[variant=inset]:min-h-[calc(100svh-var(--spacing-4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-lg',
        className,
      )}
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
      className={cn(
        'bg-background focus-visible:ring-sidebar-ring focus-visible:ring-3 h-8 w-full shadow-none',
        className,
      )}
      data-sidebar="input"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarHeader
 * -------------------------------------------------------------------------- */

type SidebarHeaderProps = ComponentProps<'div'>;

function SidebarHeader({ className, ...props }: SidebarHeaderProps): JSX.Element {
  return <div className={cn('flex flex-col gap-2 p-2', className)} data-sidebar="header" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SidebarFooter
 * -------------------------------------------------------------------------- */

type SidebarFooterProps = ComponentProps<'div'>;

function SidebarFooter({ className, ...props }: SidebarFooterProps): JSX.Element {
  return <div className={cn('flex flex-col gap-2 p-2', className)} data-sidebar="footer" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SidebarSeparator
 * -------------------------------------------------------------------------- */

type SidebarSeparatorProps = ComponentProps<typeof Separator>;

function SidebarSeparator({ className, ...props }: SidebarSeparatorProps): JSX.Element {
  return <Separator className={cn('bg-sidebar-border mx-2 w-auto', className)} data-sidebar="separator" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SidebarContent
 * -------------------------------------------------------------------------- */

type SidebarContentProps = ComponentProps<'div'>;

function SidebarContent({ className, ...props }: SidebarContentProps): JSX.Element {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden',
        className,
      )}
      data-sidebar="content"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarGroup
 * -------------------------------------------------------------------------- */

type SidebarGroupProps = ComponentProps<'div'>;

function SidebarGroup({ className, ...props }: SidebarGroupProps): JSX.Element {
  return <div className={cn('relative flex w-full min-w-0 flex-col p-2', className)} data-sidebar="group" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SidebarGroupLabel
 * -------------------------------------------------------------------------- */

interface SidebarGroupLabelProps extends ComponentProps<'div'> {
  asChild?: boolean;
}

function SidebarGroupLabel({ asChild = false, className, ...props }: SidebarGroupLabelProps): JSX.Element {
  const Component = asChild ? Slot : 'div';

  return (
    <Component
      className={cn(
        'text-sidebar-foreground/70 ring-sidebar-ring focus-visible:ring-3 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-none transition-[margin,opa] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 [&>svg]:size-4 [&>svg]:shrink-0',
        className,
      )}
      data-sidebar="group-label"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarGroupAction
 * -------------------------------------------------------------------------- */

interface SidebarGroupActionProps extends ComponentProps<'button'> {
  asChild?: boolean;
}

function SidebarGroupAction({ asChild = false, className, ...props }: SidebarGroupActionProps): JSX.Element {
  const Component = asChild ? Slot : 'button';

  return (
    <Component
      className={cn(
        'text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-3 absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-none transition-transform after:absolute after:-inset-2 group-data-[collapsible=icon]:hidden after:md:hidden [&>svg]:size-4 [&>svg]:shrink-0',
        className,
      )}
      data-sidebar="group-action"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarGroupContent
 * -------------------------------------------------------------------------- */

type SidebarGroupContentProps = ComponentProps<'div'>;

function SidebarGroupContent({ className, ...props }: SidebarGroupContentProps): JSX.Element {
  return <div className={cn('w-full text-sm', className)} data-sidebar="group-content" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SidebarMenu
 * -------------------------------------------------------------------------- */

type SidebarMenuProps = ComponentProps<'ul'>;

function SidebarMenu({ className, ...props }: SidebarMenuProps): JSX.Element {
  return <ul className={cn('flex w-full min-w-0 flex-col gap-1', className)} data-sidebar="menu" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SidebarMenuItem
 * -------------------------------------------------------------------------- */

type SidebarMenuItemProps = ComponentProps<'li'>;

function SidebarMenuItem({ className, ...props }: SidebarMenuItemProps): JSX.Element {
  return <li className={cn('group/menu-item relative', className)} data-sidebar="menu-item" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SidebarMenuButton
 * -------------------------------------------------------------------------- */

const sidebarMenuButtonVariants = tv({
  base: 'peer/menu-button ring-sidebar-ring data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground focus-visible:ring-3 flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none transition-[width,height,padding] disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:font-medium group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
  variants: {
    size: {
      default: 'h-8 text-sm',
      sm: 'h-7 text-xs',
      lg: 'h-12 text-sm group-data-[collapsible=icon]:!p-0',
    },
    variant: {
      default: 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
      outline:
        'bg-background hover:bg-sidebar-accent hover:text-sidebar-accent-foreground shadow-[0_0_0_1px_hsl(var(--color-sidebar-border))] hover:shadow-[0_0_0_1px_hsl(var(--color-sidebar-accent))]',
    },
  },
  defaultVariants: {
    size: 'default',
    variant: 'default',
  },
});

interface SidebarMenuButtonProps extends ComponentProps<'button'>, VariantProps<typeof sidebarMenuButtonVariants> {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: ComponentProps<typeof TooltipContent> | string;
}

function SidebarMenuButton({
  asChild = false,
  className,
  isActive = false,
  size = 'default',
  tooltip,
  variant = 'default',
  ...props
}: SidebarMenuButtonProps): JSX.Element {
  const Component = asChild ? Slot : 'button';
  const { isMobile, state } = useSidebar();

  const button = (
    <Component
      className={cn(sidebarMenuButtonVariants({ size, variant }), className)}
      data-active={isActive}
      data-sidebar="menu-button"
      data-size={size}
      {...props}
    />
  );

  if (!tooltip) {
    return button;
  }

  const tooltipProps =
    typeof tooltip === 'string'
      ? {
          children: tooltip,
        }
      : tooltip;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent align="center" hidden={state !== 'collapsed' || isMobile} side="right" {...tooltipProps} />
    </Tooltip>
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarMenuAction
 * -------------------------------------------------------------------------- */

interface SidebarMenuActionProps extends ComponentProps<'button'> {
  asChild?: boolean;
  showOnHover?: boolean;
}

function SidebarMenuAction({
  asChild = false,
  className,
  showOnHover = false,
  ...props
}: SidebarMenuActionProps): JSX.Element {
  const Component = asChild ? Slot : 'button';

  return (
    <Component
      className={cn(
        'text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground peer-hover/menu-button:text-sidebar-accent-foreground focus-visible:ring-3 absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-none transition-transform after:absolute after:-inset-2 group-data-[collapsible=icon]:hidden peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 after:md:hidden [&>svg]:size-4 [&>svg]:shrink-0',
        showOnHover &&
          'peer-data-[active=true]/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0',
        className,
      )}
      data-sidebar="menu-action"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarMenuBadge
 * -------------------------------------------------------------------------- */

type SidebarMenuBadgeProps = ComponentProps<'div'>;

function SidebarMenuBadge({ className, ...props }: SidebarMenuBadgeProps): JSX.Element {
  return (
    <div
      className={cn(
        'text-sidebar-foreground peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground pointer-events-none absolute right-1 flex h-5 min-w-5 select-none items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums group-data-[collapsible=icon]:hidden peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1',
        className,
      )}
      data-sidebar="menu-badge"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarMenuSkeleton
 * -------------------------------------------------------------------------- */

interface SidebarMenuSkeletonProps extends ComponentProps<'div'> {
  showIcon?: boolean;
}

function SidebarMenuSkeleton({ className, showIcon = false, ...props }: SidebarMenuSkeletonProps): JSX.Element {
  // Random width between 50 to 90%.
  const width = useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  }, []);

  return (
    <div
      className={cn('flex h-8 items-center gap-2 rounded-md px-2', className)}
      data-sidebar="menu-skeleton"
      {...props}
    >
      {showIcon ? <Skeleton className="size-4 rounded-md" data-sidebar="menu-skeleton-icon" /> : null}
      <Skeleton
        className="max-w-(--skeleton-width) h-4 flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            '--skeleton-width': width,
          } as CSSProperties
        }
      />
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarMenuSub
 * -------------------------------------------------------------------------- */

type SidebarMenuSubProps = ComponentProps<'ul'>;

function SidebarMenuSub({ className, ...props }: SidebarMenuSubProps): JSX.Element {
  return (
    <ul
      className={cn(
        'border-sidebar-border mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5 group-data-[collapsible=icon]:hidden',
        className,
      )}
      data-sidebar="menu-sub"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarMenuSubItem
 * -------------------------------------------------------------------------- */

type SidebarMenuSubItemProps = ComponentProps<'li'>;

function SidebarMenuSubItem({ ...props }: SidebarMenuSubItemProps): JSX.Element {
  return <li {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SidebarMenuSubButton
 * -------------------------------------------------------------------------- */

interface SidebarMenuSubButtonProps extends ComponentProps<'a'> {
  asChild?: boolean;
  isActive?: boolean;
  size?: 'md' | 'sm';
}

function SidebarMenuSubButton({
  asChild = false,
  className,
  isActive,
  size = 'md',
  ...props
}: SidebarMenuSubButtonProps): JSX.Element {
  const Component = asChild ? Slot : 'a';

  return (
    <Component
      className={cn(
        'text-sidebar-foreground ring-sidebar-ring [&>svg]:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground focus-visible:ring-3 flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 outline-none disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
        size === 'sm' && 'text-xs',
        size === 'md' && 'text-sm group-data-[collapsible=icon]:hidden',
        className,
      )}
      data-active={isActive}
      data-sidebar="menu-sub-button"
      data-size={size}
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
