/**
 * Extends Benchmark Data
 *
 * Data specific to extends variant benchmarks
 */

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

// Create mutable copy to avoid readonly type issues
export const mutableExtendsExtensionVariants = {
  ...extendsExtensionVariants,
  extend: { config: { ...extendsBaseVariants } },
};

export const extendsTestProps = [
  {} as const,
  { variant: "destructive" } as const,
  { size: "lg", variant: "outline" } as const,
  { size: "sm", variant: "secondary" } as const,
  { disabled: true, variant: "ghost" } as const,
  { disabled: false, size: "lg", variant: "link" } as const,
] as const;
