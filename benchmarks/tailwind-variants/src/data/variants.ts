/**
 * Variant Configurations
 *
 * All variant configurations used across benchmark scenarios
 * This provides better organization and maintainability
 */

// =============================================================================
// BASIC VARIANTS
// =============================================================================

export const buttonVariants = {
  base: "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  defaultVariants: {
    size: "default",
    variant: "default",
  },
  variants: {
    size: {
      default: "h-10 py-2 px-4",
      icon: "h-10 w-10",
      lg: "h-11 px-8 rounded-md",
      sm: "h-9 px-3 rounded-md",
    },
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "underline-offset-4 hover:underline text-primary",
      outline: "border border-input hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    },
  },
} as const;

export const complexVariants = {
  base: "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  compoundVariants: [
    {
      class: "text-lg font-bold",
      size: "lg",
      variant: "destructive",
    },
    {
      class: "cursor-not-allowed",
      disabled: true,
      loading: true,
    },
  ],
  defaultVariants: {
    disabled: false,
    loading: false,
    size: "default",
    variant: "default",
  },
  variants: {
    disabled: {
      false: "",
      true: "opacity-50 pointer-events-none",
    },
    loading: {
      false: "",
      true: "animate-spin",
    },
    size: {
      default: "h-10 py-2 px-4",
      icon: "h-10 w-10",
      lg: "h-11 px-8 rounded-md",
      sm: "h-9 px-3 rounded-md",
    },
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "underline-offset-4 hover:underline text-primary",
      outline: "border border-input hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    },
  },
} as const;

// =============================================================================
// SLOTS VARIANTS
// =============================================================================

export const slotsVariants = {
  defaultVariants: {
    size: "md",
    variant: "default",
  },
  slots: {
    base: "rounded-lg border bg-card text-card-foreground shadow-sm",
    content: "p-6 pt-0",
    description: "text-sm text-muted-foreground",
    footer: "flex items-center p-6 pt-0",
    header: "flex flex-col space-y-1.5 p-6",
    title: "text-2xl font-semibold leading-none tracking-tight",
  },
  variants: {
    size: {
      lg: {
        base: "text-lg",
        content: "p-8 pt-0",
        footer: "p-8 pt-0",
        header: "p-8",
      },
      md: "",
      sm: {
        base: "text-sm",
        content: "p-3 pt-0",
        footer: "p-3 pt-0",
        header: "p-3",
      },
    },
    variant: {
      default: "",
      destructive: {
        base: "border-destructive",
        header: "text-destructive",
        title: "text-destructive",
      },
      success: {
        base: "border-green-500",
        header: "text-green-700",
        title: "text-green-700",
      },
    },
  },
} as const;

// =============================================================================
// COMPOUND SLOTS VARIANTS
// =============================================================================

export const compoundSlotsVariants = {
  compoundSlots: [
    {
      className: "w-7 h-7 text-xs",
      size: "xs",
      slots: ["item", "prev", "next"],
    },
    {
      className: "w-8 h-8 text-sm",
      size: "sm",
      slots: ["item", "prev", "next"],
    },
    {
      className: "w-9 h-9 text-base",
      size: "md",
      slots: ["item", "prev", "next"],
    },
    {
      className: "w-10 h-10 text-lg",
      size: "lg",
      slots: ["item", "prev", "next"],
    },
    {
      className: "bg-blue-500 text-white hover:bg-blue-600",
      color: "primary",
      slots: ["item", "prev", "next"],
    },
    {
      className: "bg-gray-500 text-white hover:bg-gray-600",
      color: "secondary",
      slots: ["item", "prev", "next"],
    },
    {
      className: "bg-green-500 text-white hover:bg-green-600",
      color: "success",
      slots: ["item", "prev", "next"],
    },
    {
      className: "bg-red-500 text-white hover:bg-red-600",
      color: "danger",
      slots: ["item", "prev", "next"],
    },
    {
      className: "opacity-50 pointer-events-none cursor-not-allowed",
      disabled: true,
      slots: ["item", "prev", "next"],
    },
  ],
  defaultVariants: {
    color: "primary",
    disabled: false,
    size: "md",
  },
  slots: {
    base: "flex flex-wrap relative gap-1 max-w-fit",
    cursor: "absolute flex overflow-visible",
    item: "px-2 py-1 rounded",
    next: "px-2 py-1 rounded",
    prev: "px-2 py-1 rounded",
  },
  variants: {
    color: {
      danger: "",
      primary: "",
      secondary: "",
      success: "",
    },
    disabled: {
      false: "",
      true: "",
    },
    size: {
      lg: "",
      md: "",
      sm: "",
      xs: "",
    },
  },
} as const;

// =============================================================================
// EXTENDS VARIANTS
// =============================================================================

export const extendsBaseVariants = {
  base: "inline-flex items-center justify-center rounded-md text-sm font-medium",
  defaultVariants: {
    size: "md",
  },
  variants: {
    size: {
      lg: "h-11 px-8",
      md: "h-10 px-4",
      sm: "h-9 px-3",
    },
  },
} as const;

export const extendsExtensionVariants = {
  base: "transition-colors focus-visible:outline-none focus-visible:ring-2",
  defaultVariants: {
    disabled: false,
    variant: "default",
  },
  extend: { config: extendsBaseVariants },
  variants: {
    disabled: {
      false: "",
      true: "opacity-50 pointer-events-none",
    },
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    },
  },
} as const;

// =============================================================================
// MUTABLE COPIES
// =============================================================================

// Create mutable copies to avoid readonly type issues
export const mutableComplexVariants = {
  ...complexVariants,
  compoundVariants: [...complexVariants.compoundVariants],
};

export const mutableSlotsVariants = {
  ...slotsVariants,
};

export const mutableCompoundSlotsVariants = {
  ...compoundSlotsVariants,
  compoundSlots: [...compoundSlotsVariants.compoundSlots],
};

export const mutableExtendsExtensionVariants = {
  ...extendsExtensionVariants,
  extend: { config: { ...extendsBaseVariants } },
};
