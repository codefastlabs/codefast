/**
 * Simple Benchmark Data
 *
 * Data specific to simple variant benchmarks
 */

export const buttonVariants = {
  base: "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background select-none cursor-pointer antialiased",
  defaultVariants: {
    animation: "none",
    rounded: "md",
    shadow: "none",
    size: "default",
    variant: "default",
  },
  variants: {
    animation: {
      bounce: "animate-bounce",
      none: "",
      ping: "animate-ping",
      pulse: "animate-pulse",
      spin: "animate-spin",
      wiggle: "animate-wiggle",
    },
    rounded: {
      "2xl": "rounded-2xl",
      "3xl": "rounded-3xl",
      full: "rounded-full",
      lg: "rounded-lg",
      md: "rounded-md",
      none: "rounded-none",
      sm: "rounded-sm",
      xl: "rounded-xl",
    },
    shadow: {
      "2xl": "shadow-2xl",
      inner: "shadow-inner",
      lg: "shadow-lg",
      md: "shadow-md",
      none: "",
      sm: "shadow-sm",
      xl: "shadow-xl",
    },
    size: {
      default: "h-10 px-4 py-2 text-sm min-w-10",
      icon: "h-10 w-10 p-0",
      "icon-lg": "h-12 w-12 p-0",
      "icon-sm": "h-8 w-8 p-0",
      lg: "h-11 px-8 py-3 text-base min-w-11",
      sm: "h-9 px-3 py-2 text-sm min-w-9",
      xl: "h-12 px-10 py-4 text-lg min-w-12",
      xs: "h-8 px-2 py-1 text-xs min-w-8",
    },
    variant: {
      default:
        "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 focus:bg-primary/90",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80 focus:bg-destructive/90",
      ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/80 focus:bg-accent",
      gradient:
        "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600",
      info: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:bg-blue-700",
      link: "text-primary underline-offset-4 hover:underline active:text-primary/80 focus:text-primary/90",
      outline:
        "border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/80 focus:bg-accent",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70 focus:bg-secondary/80",
      success: "bg-green-600 text-white hover:bg-green-700 active:bg-green-800 focus:bg-green-700",
      warning:
        "bg-yellow-600 text-white hover:bg-yellow-700 active:bg-yellow-800 focus:bg-yellow-700",
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
  { rounded: "full", size: "xs", variant: "success" },
  { shadow: "lg", size: "xl", variant: "warning" },
  { animation: "pulse", variant: "info" },
  { rounded: "2xl", shadow: "xl", size: "icon-lg", variant: "gradient" },
  { rounded: "none", shadow: "inner", variant: "secondary" },
  { animation: "bounce", size: "icon-sm", variant: "outline" },
];
