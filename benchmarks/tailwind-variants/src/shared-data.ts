/**
 * Shared Data for Tailwind Variants Benchmark
 *
 * This file contains shared sample configurations and test cases
 * used across different benchmark scenarios.
 */

// Sample variant configurations for testing
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

// Create mutable copy to avoid readonly type issues
export const mutableComplexVariants = {
  ...complexVariants,
  compoundVariants: [...complexVariants.compoundVariants],
};

// Test data for simple variants
export const simpleTestProps = [
  {} as const,
  { variant: "destructive" } as const,
  { size: "lg" } as const,
  { className: "custom-class", size: "sm", variant: "outline" } as const,
  { size: "icon", variant: "ghost" } as const,
  { className: "custom-class", variant: "link" } as const,
];

// Test data for complex variants
export const complexTestProps = [
  {} as const,
  { size: "lg", variant: "destructive" } as const,
  { disabled: true, loading: true } as const,
  { disabled: false, size: "sm", variant: "outline" } as const,
  { loading: true, size: "icon", variant: "ghost" } as const,
  { className: "custom-class", disabled: true, variant: "link" } as const,
];
