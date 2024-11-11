'use client';

import { useMediaQuery } from '@codefast/hooks';
import { Slot } from '@radix-ui/react-slot';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { PanelLeftIcon } from 'lucide-react';
import {
  type ComponentProps,
  type ComponentRef,
  createContext,
  type CSSProperties,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

import { Button } from '@/components/button';
import { Separator } from '@/components/separator';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/sheet';
import { Skeleton } from '@/components/skeleton';
import { TextInput } from '@/components/text-input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/tooltip';
import { cn } from '@/lib/utils';

const SIDEBAR_COOKIE_NAME = 'sidebar:state';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
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
  state: 'expanded' | 'collapsed';
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContext | null>(null);

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

type SidebarProviderElement = HTMLDivElement;
interface SidebarProviderProps extends ComponentProps<'div'> {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}

const SidebarProvider = forwardRef<SidebarProviderElement, SidebarProviderProps>(
  ({ defaultOpen = true, open: openProp, onOpenChange: setOpenProp, className, style, children, ...props }, ref) => {
    const isMobile = useMediaQuery(`(max-width: ${SIDEBAR_MOBILE_BREAKPOINT - 1}px)`);
    const [openMobile, setOpenMobile] = useState(false);

    // This is the internal state of the sidebar.
    // We use openProp and setOpenProp for control from outside the component.
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const open = openProp ?? isOpen;
    const setOpen = useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === 'function' ? value(open) : value;

        if (setOpenProp) {
          setOpenProp(openState);
        } else {
          setIsOpen(openState);
        }

        // This sets the cookie to keep the sidebar state.
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
      },
      [setOpenProp, open],
    );

    // Helper to toggle the sidebar.
    const toggleSidebar = useCallback(() => {
      isMobile ? setOpenMobile((currentValue) => !currentValue) : setOpen((currentValue) => !currentValue);
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
            ref={ref}
            className={cn(
              'group/sidebar-wrapper has-[[data-variant=inset]]:bg-sidebar flex min-h-svh w-full',
              className,
            )}
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
  },
);

SidebarProvider.displayName = 'SidebarProvider';

/* -----------------------------------------------------------------------------
 * Component: Sidebar
 * -------------------------------------------------------------------------- */

type SidebarElement = HTMLDivElement;
interface SidebarProps extends ComponentProps<'div'> {
  collapsible?: 'offcanvas' | 'icon' | 'none';
  side?: 'left' | 'right';
  variant?: 'sidebar' | 'floating' | 'inset';
}

const Sidebar = forwardRef<SidebarElement, SidebarProps>(
  ({ side = 'left', variant = 'sidebar', collapsible = 'offcanvas', className, children, ...props }, ref) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

    if (collapsible === 'none') {
      return (
        <div
          ref={ref}
          className={cn('bg-sidebar text-sidebar-foreground flex h-full w-[--sidebar-width] flex-col', className)}
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
            className="bg-sidebar text-sidebar-foreground w-[--sidebar-width] p-0 [&>button]:hidden"
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
        ref={ref}
        className="text-sidebar-foreground group peer hidden md:block"
        data-collapsible={state === 'collapsed' ? collapsible : ''}
        data-side={side}
        data-state={state}
        data-variant={variant}
      >
        {/* This is what handles the sidebar gap on desktop */}
        <div
          className={cn(
            'relative h-svh w-[--sidebar-width] bg-transparent transition-[width] duration-200 ease-linear',
            'group-data-[collapsible=offcanvas]:w-0',
            'group-data-[side=right]:rotate-180',
            variant === 'floating' || variant === 'inset'
              ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]'
              : 'group-data-[collapsible=icon]:w-[--sidebar-width-icon]',
          )}
        />
        <div
          className={cn(
            'fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] duration-200 ease-linear md:flex',
            side === 'left'
              ? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
              : 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
            // Adjust the padding for floating and inset variants.
            variant === 'floating' || variant === 'inset'
              ? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]'
              : 'group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l',
            className,
          )}
          {...props}
        >
          <div
            className="bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow"
            data-sidebar="sidebar"
          >
            {children}
          </div>
        </div>
      </div>
    );
  },
);

Sidebar.displayName = 'Sidebar';

/* -----------------------------------------------------------------------------
 * Component: SidebarTrigger
 * -------------------------------------------------------------------------- */

type SidebarTriggerElement = ComponentRef<typeof Button>;
type SidebarTriggerProps = ComponentProps<typeof Button>;

const SidebarTrigger = forwardRef<SidebarTriggerElement, SidebarTriggerProps>(
  ({ className, onClick, ...props }, ref) => {
    const { toggleSidebar } = useSidebar();

    return (
      <Button
        ref={ref}
        icon
        className={cn('', className)}
        data-sidebar="trigger"
        size="xxs"
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
  },
);

SidebarTrigger.displayName = 'SidebarTrigger';

/* -----------------------------------------------------------------------------
 * Component: SidebarRail
 * -------------------------------------------------------------------------- */

type SidebarRailElement = HTMLButtonElement;
type SidebarRailProps = ComponentProps<'button'>;

const SidebarRail = forwardRef<SidebarRailElement, SidebarRailProps>(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      ref={ref}
      aria-label="Toggle Sidebar"
      className={cn(
        'hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex',
        '[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize',
        '[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize',
        'group-data-[collapsible=offcanvas]:hover:bg-sidebar group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full',
        '[[data-side=left][data-collapsible=offcanvas]_&]:-right-2',
        '[[data-side=right][data-collapsible=offcanvas]_&]:-left-2',
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
});

SidebarRail.displayName = 'SidebarRail';

/* -----------------------------------------------------------------------------
 * Component: SidebarInset
 * -------------------------------------------------------------------------- */

type SidebarInsetElement = HTMLDivElement;
type SidebarInsetProps = ComponentProps<'main'>;

const SidebarInset = forwardRef<SidebarInsetElement, SidebarInsetProps>(({ className, ...props }, ref) => {
  return (
    <main
      ref={ref}
      className={cn(
        'bg-background relative flex min-h-svh flex-1 flex-col',
        'peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow',
        className,
      )}
      {...props}
    />
  );
});

SidebarInset.displayName = 'SidebarInset';

/* -----------------------------------------------------------------------------
 * Component: SidebarInput
 * -------------------------------------------------------------------------- */

type SidebarInputElement = ComponentRef<typeof TextInput>;
type SidebarInputProps = ComponentProps<typeof TextInput>;

const SidebarInput = forwardRef<SidebarInputElement, SidebarInputProps>(({ className, ...props }, ref) => {
  return (
    <TextInput
      ref={ref}
      className={cn(
        'bg-background focus-visible:ring-sidebar-ring h-8 w-full shadow-none focus-visible:ring-2',
        className,
      )}
      data-sidebar="input"
      {...props}
    />
  );
});

SidebarInput.displayName = 'SidebarInput';

/* -----------------------------------------------------------------------------
 * Component: SidebarHeader
 * -------------------------------------------------------------------------- */

type SidebarHeaderElement = HTMLDivElement;
type SidebarHeaderProps = ComponentProps<'div'>;

const SidebarHeader = forwardRef<SidebarHeaderElement, SidebarHeaderProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn('flex flex-col gap-2 p-2', className)} data-sidebar="header" {...props} />;
});

SidebarHeader.displayName = 'SidebarHeader';

/* -----------------------------------------------------------------------------
 * Component: SidebarFooter
 * -------------------------------------------------------------------------- */

type SidebarFooterElement = HTMLDivElement;
type SidebarFooterProps = ComponentProps<'div'>;

const SidebarFooter = forwardRef<SidebarFooterElement, SidebarFooterProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn('flex flex-col gap-2 p-2', className)} data-sidebar="footer" {...props} />;
});

SidebarFooter.displayName = 'SidebarFooter';

/* -----------------------------------------------------------------------------
 * Component: SidebarSeparator
 * -------------------------------------------------------------------------- */

type SidebarSeparatorElement = ComponentRef<typeof Separator>;
type SidebarSeparatorProps = ComponentProps<typeof Separator>;

const SidebarSeparator = forwardRef<SidebarSeparatorElement, SidebarSeparatorProps>(({ className, ...props }, ref) => {
  return (
    <Separator
      ref={ref}
      className={cn('bg-sidebar-border mx-2 w-auto', className)}
      data-sidebar="separator"
      {...props}
    />
  );
});

SidebarSeparator.displayName = 'SidebarSeparator';

/* -----------------------------------------------------------------------------
 * Component: SidebarContent
 * -------------------------------------------------------------------------- */

type SidebarContentElement = HTMLDivElement;
type SidebarContentProps = ComponentProps<'div'>;

const SidebarContent = forwardRef<SidebarContentElement, SidebarContentProps>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden',
        className,
      )}
      data-sidebar="content"
      {...props}
    />
  );
});

SidebarContent.displayName = 'SidebarContent';

/* -----------------------------------------------------------------------------
 * Component: SidebarGroup
 * -------------------------------------------------------------------------- */

type SidebarGroupElement = HTMLDivElement;
type SidebarGroupProps = ComponentProps<'div'>;

const SidebarGroup = forwardRef<SidebarGroupElement, SidebarGroupProps>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('relative flex w-full min-w-0 flex-col p-2', className)}
      data-sidebar="group"
      {...props}
    />
  );
});

SidebarGroup.displayName = 'SidebarGroup';

/* -----------------------------------------------------------------------------
 * Component: SidebarGroupLabel
 * -------------------------------------------------------------------------- */

type SidebarGroupLabelElement = HTMLDivElement;
interface SidebarGroupLabelProps extends ComponentProps<'div'> {
  asChild?: boolean;
}

const SidebarGroupLabel = forwardRef<SidebarGroupLabelElement, SidebarGroupLabelProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'div';

    return (
      <Comp
        ref={ref}
        className={cn(
          'text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-none transition-[margin,opa] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
          'group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0',
          className,
        )}
        data-sidebar="group-label"
        {...props}
      />
    );
  },
);

SidebarGroupLabel.displayName = 'SidebarGroupLabel';

/* -----------------------------------------------------------------------------
 * Component: SidebarGroupAction
 * -------------------------------------------------------------------------- */

type SidebarGroupActionElement = HTMLButtonElement;
interface SidebarGroupActionProps extends ComponentProps<'button'> {
  asChild?: boolean;
}

const SidebarGroupAction = forwardRef<SidebarGroupActionElement, SidebarGroupActionProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        className={cn(
          'text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-none transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
          // Increases the hit area of the button on mobile.
          'after:absolute after:-inset-2 after:md:hidden',
          'group-data-[collapsible=icon]:hidden',
          className,
        )}
        data-sidebar="group-action"
        {...props}
      />
    );
  },
);

SidebarGroupAction.displayName = 'SidebarGroupAction';

/* -----------------------------------------------------------------------------
 * Component: SidebarGroupContent
 * -------------------------------------------------------------------------- */

type SidebarGroupContentElement = HTMLDivElement;
type SidebarGroupContentProps = ComponentProps<'div'>;

const SidebarGroupContent = forwardRef<SidebarGroupContentElement, SidebarGroupContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('w-full text-sm', className)} data-sidebar="group-content" {...props} />
  ),
);

SidebarGroupContent.displayName = 'SidebarGroupContent';

/* -----------------------------------------------------------------------------
 * Component: SidebarMenu
 * -------------------------------------------------------------------------- */

type SidebarMenuElement = HTMLUListElement;
type SidebarMenuProps = ComponentProps<'ul'>;

const SidebarMenu = forwardRef<SidebarMenuElement, SidebarMenuProps>(({ className, ...props }, ref) => (
  <ul ref={ref} className={cn('flex w-full min-w-0 flex-col gap-1', className)} data-sidebar="menu" {...props} />
));

SidebarMenu.displayName = 'SidebarMenu';

/* -----------------------------------------------------------------------------
 * Component: SidebarMenuItem
 * -------------------------------------------------------------------------- */

type SidebarMenuItemElement = HTMLLIElement;
type SidebarMenuItemProps = ComponentProps<'li'>;

const SidebarMenuItem = forwardRef<SidebarMenuItemElement, SidebarMenuItemProps>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn('group/menu-item relative', className)} data-sidebar="menu-item" {...props} />
));

SidebarMenuItem.displayName = 'SidebarMenuItem';

/* -----------------------------------------------------------------------------
 * Component: SidebarMenuButton
 * -------------------------------------------------------------------------- */

const sidebarMenuButtonVariants = tv({
  base: 'peer/menu-button ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none transition-[width,height,padding] focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:font-medium group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
  variants: {
    variant: {
      default: 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
      outline:
        'bg-background hover:bg-sidebar-accent hover:text-sidebar-accent-foreground shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]',
    },
    size: {
      default: 'h-8 text-sm',
      sm: 'h-7 text-xs',
      lg: 'h-12 text-sm group-data-[collapsible=icon]:!p-0',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

type SidebarMenuButtonElement = HTMLButtonElement;
interface SidebarMenuButtonProps extends ComponentProps<'button'>, VariantProps<typeof sidebarMenuButtonVariants> {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string | ComponentProps<typeof TooltipContent>;
}

const SidebarMenuButton = forwardRef<SidebarMenuButtonElement, SidebarMenuButtonProps>(
  ({ asChild = false, isActive = false, variant = 'default', size = 'default', tooltip, className, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const { isMobile, state } = useSidebar();

    const button = (
      <Comp
        ref={ref}
        className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
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
  },
);

SidebarMenuButton.displayName = 'SidebarMenuButton';

/* -----------------------------------------------------------------------------
 * Component: SidebarMenuAction
 * -------------------------------------------------------------------------- */

type SidebarMenuActionElement = HTMLButtonElement;
interface SidebarMenuActionProps extends ComponentProps<'button'> {
  asChild?: boolean;
  showOnHover?: boolean;
}
const SidebarMenuAction = forwardRef<SidebarMenuActionElement, SidebarMenuActionProps>(
  ({ className, asChild = false, showOnHover = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        className={cn(
          'text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground peer-hover/menu-button:text-sidebar-accent-foreground absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-none transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
          // Increases the hit area of the button on mobile.
          'after:absolute after:-inset-2 after:md:hidden',
          'peer-data-[size=sm]/menu-button:top-1',
          'peer-data-[size=default]/menu-button:top-1.5',
          'peer-data-[size=lg]/menu-button:top-2.5',
          'group-data-[collapsible=icon]:hidden',
          showOnHover &&
            'peer-data-[active=true]/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0',
          className,
        )}
        data-sidebar="menu-action"
        {...props}
      />
    );
  },
);

SidebarMenuAction.displayName = 'SidebarMenuAction';

/* -----------------------------------------------------------------------------
 * Component: SidebarMenuBadge
 * -------------------------------------------------------------------------- */

type SidebarMenuBadgeElement = HTMLDivElement;
type SidebarMenuBadgeProps = ComponentProps<'div'>;
const SidebarMenuBadge = forwardRef<SidebarMenuBadgeElement, SidebarMenuBadgeProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'text-sidebar-foreground pointer-events-none absolute right-1 flex h-5 min-w-5 select-none items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums',
      'peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground',
      'peer-data-[size=sm]/menu-button:top-1',
      'peer-data-[size=default]/menu-button:top-1.5',
      'peer-data-[size=lg]/menu-button:top-2.5',
      'group-data-[collapsible=icon]:hidden',
      className,
    )}
    data-sidebar="menu-badge"
    {...props}
  />
));

SidebarMenuBadge.displayName = 'SidebarMenuBadge';

/* -----------------------------------------------------------------------------
 * Component: SidebarMenuSkeleton
 * -------------------------------------------------------------------------- */

type SidebarMenuSkeletonElement = HTMLDivElement;
interface SidebarMenuSkeletonProps extends ComponentProps<'div'> {
  showIcon?: boolean;
}
const SidebarMenuSkeleton = forwardRef<SidebarMenuSkeletonElement, SidebarMenuSkeletonProps>(
  ({ className, showIcon = false, ...props }, ref) => {
    // Random width between 50 to 90%.
    const width = useMemo(() => {
      return `${Math.floor(Math.random() * 40) + 50}%`;
    }, []);

    return (
      <div
        ref={ref}
        className={cn('flex h-8 items-center gap-2 rounded-md px-2', className)}
        data-sidebar="menu-skeleton"
        {...props}
      >
        {showIcon ? <Skeleton className="size-4 rounded-md" data-sidebar="menu-skeleton-icon" /> : null}
        <Skeleton
          className="h-4 max-w-[--skeleton-width] flex-1"
          data-sidebar="menu-skeleton-text"
          style={
            {
              '--skeleton-width': width,
            } as CSSProperties
          }
        />
      </div>
    );
  },
);

SidebarMenuSkeleton.displayName = 'SidebarMenuSkeleton';

/* -----------------------------------------------------------------------------
 * Component: SidebarMenuSub
 * -------------------------------------------------------------------------- */

type SidebarMenuSubElement = HTMLUListElement;
type SidebarMenuSubProps = ComponentProps<'ul'>;
const SidebarMenuSub = forwardRef<SidebarMenuSubElement, SidebarMenuSubProps>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn(
      'border-sidebar-border mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5',
      'group-data-[collapsible=icon]:hidden',
      className,
    )}
    data-sidebar="menu-sub"
    {...props}
  />
));

SidebarMenuSub.displayName = 'SidebarMenuSub';

/* -----------------------------------------------------------------------------
 * Component: SidebarMenuSubItem
 * -------------------------------------------------------------------------- */

type SidebarMenuSubItemElement = HTMLLIElement;
type SidebarMenuSubItemProps = ComponentProps<'li'>;
const SidebarMenuSubItem = forwardRef<SidebarMenuSubItemElement, SidebarMenuSubItemProps>(({ ...props }, ref) => (
  <li ref={ref} {...props} />
));

SidebarMenuSubItem.displayName = 'SidebarMenuSubItem';

/* -----------------------------------------------------------------------------
 * Component: SidebarMenuSubButton
 * -------------------------------------------------------------------------- */

type SidebarMenuSubButtonElement = HTMLAnchorElement;
interface SidebarMenuSubButtonProps extends ComponentProps<'a'> {
  asChild?: boolean;
  isActive?: boolean;
  size?: 'sm' | 'md';
}

const SidebarMenuSubButton = forwardRef<SidebarMenuSubButtonElement, SidebarMenuSubButtonProps>(
  ({ asChild = false, size = 'md', isActive, className, ...props }, ref) => {
    const Comp = asChild ? Slot : 'a';

    return (
      <Comp
        ref={ref}
        className={cn(
          'text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
          'data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground',
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          'group-data-[collapsible=icon]:hidden',
          className,
        )}
        data-active={isActive}
        data-sidebar="menu-sub-button"
        data-size={size}
        {...props}
      />
    );
  },
);

SidebarMenuSubButton.displayName = 'SidebarMenuSubButton';

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
