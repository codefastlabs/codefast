import { buttonVariants } from "@/components/button.variants";
import { tv } from "@codefast/tailwind-variants";

/* -----------------------------------------------------------------------------
 * Style: NavigationMenuTrigger
 * -------------------------------------------------------------------------- */

const navigationMenuTriggerStyle = tv({
  base: buttonVariants({
    className:
      "data-[state=open]:bg-secondary/50 data-[state=open]:text-secondary-foreground group/navigation-menu-trigger focus-visible:bg-secondary dark:hover:not-disabled:bg-secondary",
    variant: "ghost",
  }),
});

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { navigationMenuTriggerStyle };
