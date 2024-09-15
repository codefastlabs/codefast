import { tv, type VariantProps } from 'tailwind-variants';

const navigationMenuVariants = tv({
  slots: {
    root: 'relative z-10 flex max-w-max flex-1 items-center justify-center',
    list: 'group flex flex-1 list-none items-center justify-center space-x-1',
    trigger:
      'bg-background hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent/50 data-[active]:bg-accent/50 group inline-flex h-10 w-max items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50',
    triggerIcon: 'relative top-px ml-1 size-3 transition group-data-[state=open]:rotate-180',
    content:
      'data-[motion^=from-]:animate-in data-[motion^=from-]:fade-in data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion^=to-]:animate-out data-[motion^=to-]:fade-out data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 left-0 top-0 w-full md:absolute md:w-auto',
    viewportWrapper: 'perspective-[125rem] absolute left-0 top-full flex justify-center',
    viewport:
      'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-90 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full origin-[top_center] overflow-hidden rounded-md border transition-[width,height] sm:w-[var(--radix-navigation-menu-viewport-width)]',
    indicator:
      'data-[state=visible]:animate-fade-in data-[state=hidden]:animate-fade-out top-full z-10 flex h-1.5 items-center justify-center overflow-hidden transition',
    indicatorIcon: 'bg-border relative top-[60%] size-2 rotate-45 rounded-tl-sm',
  },
});

type NavigationMenuVariantsProps = VariantProps<typeof navigationMenuVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { navigationMenuVariants, type NavigationMenuVariantsProps };
