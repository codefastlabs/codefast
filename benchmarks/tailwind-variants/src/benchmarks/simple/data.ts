/**
 * Simple Benchmark Data
 *
 * Data specific to simple variant benchmarks
 */

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
};

export const simpleTestProps = [
  {},
  { variant: "destructive" },
  { size: "lg" },
  { className: "custom-class", size: "sm", variant: "outline" },
  { size: "icon", variant: "ghost" },
  { className: "custom-class", variant: "link" },
];
