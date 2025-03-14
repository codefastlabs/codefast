'use client';

import type { ComponentProps, CSSProperties, JSX } from 'react';
import type { VariantProps } from 'tailwind-variants';

import { useIsMobile } from '@codefast/hooks';
import { Slot } from '@radix-ui/react-slot';
import { PanelLeftIcon } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { tv } from 'tailwind-variants';

import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Separator } from '@/components/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/sheet';
import { Skeleton } from '@/components/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/tooltip';
import { cn } from '@/lib/utils';

const SIDEBAR_COOKIE_NAME = 'sidebar_state';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = '16rem';
const SIDEBAR_WIDTH_MOBILE = '18rem';
const SIDEBAR_WIDTH_ICON = '3rem';
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';

interface SidebarContextProps {
  isMobile: boolean;
  open: boolean;
  openMobile: boolean;
  setOpen: (open: boolean) => void;
  setOpenMobile: (open: boolean) => void;
  state: 'collapsed' | 'expanded';
  toggleSidebar: () => void;
}

const SidebarContext = createContext<null | SidebarContextProps>(null);

function useSidebar(): SidebarContextProps {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }

  return context;
}

/* -----------------------------------------------------------------------------
 * Component: SidebarProvider
 * -------------------------------------------------------------------------- */

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: ComponentProps<'div'> & {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}): JSX.Element {
  const isMobile = useIsMobile();
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
    const handleKeyDown: (event: KeyboardEvent) => void = (event: KeyboardEvent) => {
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

  const contextValue = useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          className={cn('group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full', className)}
          data-slot="sidebar-wrapper"
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

function Sidebar({
  side = 'left',
  variant = 'sidebar',
  collapsible = 'offcanvas',
  className,
  children,
  ...props
}: ComponentProps<'div'> & {
  collapsible?: 'icon' | 'none' | 'offcanvas';
  side?: 'left' | 'right';
  variant?: 'floating' | 'inset' | 'sidebar';
}): JSX.Element {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  if (collapsible === 'none') {
    return (
      <div
        className={cn('bg-sidebar text-sidebar-foreground w-(--sidebar-width) flex h-full flex-col', className)}
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
              '--sidebar-width': SIDEBAR_WIDTH_MOBILE,
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
      className={cn('text-sidebar-foreground group peer hidden md:block', className)}
      data-collapsible={state === 'collapsed' ? collapsible : ''}
      data-side={side}
      data-slot="sidebar"
      data-state={state}
      data-variant={variant}
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div
        className={cn(
          'w-(--sidebar-width) relative bg-transparent transition-[width] duration-200 ease-linear group-data-[collapsible=offcanvas]:w-0 group-data-[side=right]:rotate-180',
          variant === 'floating' || variant === 'inset'
            ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]'
            : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)',
        )}
        data-slot="sidebar-gap"
      />
      <div
        className={cn(
          'w-(--sidebar-width) fixed inset-y-0 z-10 hidden h-svh transition-[left,right,width] duration-200 ease-linear md:flex',
          side === 'left'
            ? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
            : 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
          // Adjust the padding for floating and inset variants.
          variant === 'floating' || variant === 'inset'
            ? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]'
            : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l',
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

function SidebarTrigger({ className, onClick, ...props }: ComponentProps<typeof Button>): JSX.Element {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      className={cn('size-7', className)}
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

function SidebarRail({ className, ...props }: ComponentProps<'button'>): JSX.Element {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      className={cn(
        'hover:after:bg-sidebar-border in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize hover:group-data-[collapsible=offcanvas]:bg-sidebar absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] group-data-[side=left]:-right-4 group-data-[side=right]:left-0 group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full sm:flex [[data-side=left][data-collapsible=offcanvas]_&]:-right-2 [[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-collapsible=offcanvas]_&]:-left-2 [[data-side=right][data-state=collapsed]_&]:cursor-w-resize',
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

function SidebarInset({ className, ...props }: ComponentProps<'main'>): JSX.Element {
  return (
    <main
      className={cn(
        'bg-background relative flex w-full flex-1 flex-col md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm',
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

function SidebarInput({ className, ...props }: ComponentProps<typeof Input>): JSX.Element {
  return (
    <Input
      className={cn('bg-background h-8 w-full shadow-none', className)}
      data-sidebar="input"
      data-slot="sidebar-input"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarHeader
 * -------------------------------------------------------------------------- */

function SidebarHeader({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return (
    <div
      className={cn('flex flex-col gap-2 p-2', className)}
      data-sidebar="header"
      data-slot="sidebar-header"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarFooter
 * -------------------------------------------------------------------------- */

function SidebarFooter({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return (
    <div
      className={cn('flex flex-col gap-2 p-2', className)}
      data-sidebar="footer"
      data-slot="sidebar-footer"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarSeparator
 * -------------------------------------------------------------------------- */

function SidebarSeparator({ className, ...props }: ComponentProps<typeof Separator>): JSX.Element {
  return (
    <Separator
      className={cn('bg-sidebar-border mx-2 w-auto', className)}
      data-sidebar="separator"
      data-slot="sidebar-separator"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarContent
 * -------------------------------------------------------------------------- */

function SidebarContent({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden',
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

function SidebarGroup({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return (
    <div
      className={cn('relative flex w-full min-w-0 flex-col p-2', className)}
      data-sidebar="group"
      data-slot="sidebar-group"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarGroupLabel
 * -------------------------------------------------------------------------- */

function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: ComponentProps<'div'> & {
  asChild?: boolean;
}): JSX.Element {
  const Component = asChild ? Slot : 'div';

  return (
    <Component
      className={cn(
        'text-sidebar-foreground/70 ring-sidebar-ring outline-hidden focus-visible:ring-3 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 [&>svg]:size-4 [&>svg]:shrink-0',
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

function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: ComponentProps<'button'> & {
  asChild?: boolean;
}): JSX.Element {
  const Component = asChild ? Slot : 'button';

  return (
    <Component
      className={cn(
        'text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground outline-hidden focus-visible:ring-3 absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 transition-transform after:absolute after:-inset-2 group-data-[collapsible=icon]:hidden md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0',
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

function SidebarGroupContent({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return (
    <div
      className={cn('w-full text-sm', className)}
      data-sidebar="group-content"
      data-slot="sidebar-group-content"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarMenu
 * -------------------------------------------------------------------------- */

function SidebarMenu({ className, ...props }: ComponentProps<'ul'>): JSX.Element {
  return (
    <ul
      className={cn('flex w-full min-w-0 flex-col gap-1', className)}
      data-sidebar="menu"
      data-slot="sidebar-menu"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarMenuItem
 * -------------------------------------------------------------------------- */

function SidebarMenuItem({ className, ...props }: ComponentProps<'li'>): JSX.Element {
  return (
    <li
      className={cn('group/menu-item relative', className)}
      data-sidebar="menu-item"
      data-slot="sidebar-menu-item"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Variant: SidebarMenuButton
 * -------------------------------------------------------------------------- */

const sidebarMenuButtonVariants = tv({
  base: 'peer/menu-button outline-hidden ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground group-has-data-[sidebar=menu-action]/menu-item:pr-8 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! focus-visible:ring-3 flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm transition-[width,height,padding] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:font-medium [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
  variants: {
    variant: {
      default: 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
      outline:
        'bg-background hover:bg-sidebar-accent hover:text-sidebar-accent-foreground shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]',
    },
    size: {
      sm: 'h-7 text-xs',
      md: 'h-8 text-sm',
      lg: 'group-data-[collapsible=icon]:p-0! h-12 text-sm',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

/* -----------------------------------------------------------------------------
 * Component: SidebarMenuButton
 * -------------------------------------------------------------------------- */

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = 'default',
  size = 'md',
  tooltip,
  className,
  ...props
}: ComponentProps<'button'> &
  VariantProps<typeof sidebarMenuButtonVariants> & {
    asChild?: boolean;
    isActive?: boolean;
    tooltip?: ComponentProps<typeof TooltipContent> | string;
  }): JSX.Element {
  const Component = asChild ? Slot : 'button';
  const { isMobile, state } = useSidebar();

  const button = (
    <Component
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
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

  if (typeof tooltip === 'string') {
    // eslint-disable-next-line no-param-reassign -- convert it to an object with default properties
    tooltip = {
      children: tooltip,
    };
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent align="center" hidden={state !== 'collapsed' || isMobile} side="right" {...tooltip} />
    </Tooltip>
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarMenuAction
 * -------------------------------------------------------------------------- */

function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: ComponentProps<'button'> & {
  asChild?: boolean;
  showOnHover?: boolean;
}): JSX.Element {
  const Component = asChild ? Slot : 'button';

  return (
    <Component
      className={cn(
        'text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground peer-hover/menu-button:text-sidebar-accent-foreground outline-hidden focus-visible:ring-3 absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 transition-transform after:absolute after:-inset-2 group-data-[collapsible=icon]:hidden peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0',
        showOnHover &&
          'peer-data-[active=true]/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0',
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

function SidebarMenuBadge({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return (
    <div
      className={cn(
        'text-sidebar-foreground peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground pointer-events-none absolute right-1 flex h-5 min-w-5 select-none items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums group-data-[collapsible=icon]:hidden peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1',
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

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: ComponentProps<'div'> & {
  showIcon?: boolean;
}): JSX.Element {
  // Random width between 50 to 90%.
  const width = useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  }, []);

  return (
    <div
      className={cn('flex h-8 items-center gap-2 rounded-md px-2', className)}
      data-sidebar="menu-skeleton"
      data-slot="sidebar-menu-skeleton"
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

function SidebarMenuSub({ className, ...props }: ComponentProps<'ul'>): JSX.Element {
  return (
    <ul
      className={cn(
        'border-sidebar-border mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5 group-data-[collapsible=icon]:hidden',
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

function SidebarMenuSubItem({ className, ...props }: ComponentProps<'li'>): JSX.Element {
  return (
    <li
      className={cn('group/menu-sub-item relative', className)}
      data-sidebar="menu-sub-item"
      data-slot="sidebar-menu-sub-item"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SidebarMenuSubButton
 * -------------------------------------------------------------------------- */

function SidebarMenuSubButton({
  asChild = false,
  size = 'md',
  isActive = false,
  className,
  ...props
}: ComponentProps<'a'> & {
  asChild?: boolean;
  isActive?: boolean;
  size?: 'md' | 'sm';
}): JSX.Element {
  const Component = asChild ? Slot : 'a';

  return (
    <Component
      className={cn(
        'text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground outline-hidden focus-visible:ring-3 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
        size === 'sm' && 'text-xs',
        size === 'md' && 'text-sm',
        'group-data-[collapsible=icon]:hidden',
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
