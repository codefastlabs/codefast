/**
 * Slots Benchmark Data
 *
 * Data specific to slots variant benchmarks
 */

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

// Create mutable copy to avoid readonly type issues
export const mutableSlotsVariants = {
  ...slotsVariants,
};

export const slotsTestProps = [
  {} as const,
  { variant: "destructive" } as const,
  { size: "lg", variant: "success" } as const,
  { size: "sm" } as const,
  { size: "sm", variant: "destructive" } as const,
  { size: "lg", variant: "success" } as const,
] as const;
