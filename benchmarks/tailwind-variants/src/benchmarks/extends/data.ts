/**
 * Extends Benchmark Data
 *
 * Data specific to extends variant benchmarks
 */

export const extendsBaseVariants = {
  base: "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 select-none cursor-pointer antialiased",
  defaultVariants: {
    rounded: "md",
    shadow: "none",
    size: "md",
  },
  variants: {
    rounded: {
      full: "rounded-full",
      lg: "rounded-lg",
      md: "rounded-md",
      none: "rounded-none",
      sm: "rounded-sm",
      xl: "rounded-xl",
    },
    shadow: {
      lg: "shadow-lg",
      md: "shadow-md",
      none: "",
      sm: "shadow-sm",
      xl: "shadow-xl",
    },
    size: {
      lg: "h-11 px-8 py-3 text-base min-w-11 gap-2",
      md: "h-10 px-4 py-2 text-sm min-w-10 gap-1.5",
      sm: "h-9 px-3 py-2 text-sm min-w-9 gap-1",
      xl: "h-12 px-10 py-4 text-lg min-w-12 gap-2.5",
      xs: "h-8 px-2 py-1 text-xs min-w-8 gap-1",
    },
  },
};

export const extendsExtensionVariants = {
  base: "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ring-offset-background transform-gpu",
  defaultVariants: {
    animation: "none",
    disabled: false,
    glass: false,
    loading: false,
    variant: "default",
  },
  extend: { config: extendsBaseVariants },
  variants: {
    animation: {
      bounce: "hover:animate-bounce",
      none: "",
      pulse: "animate-pulse",
      scale: "hover:scale-105 transition-transform",
      spin: "animate-spin",
    },
    disabled: {
      false: "",
      true: "opacity-50 pointer-events-none cursor-not-allowed grayscale",
    },
    glass: {
      false: "",
      true: "backdrop-blur-md bg-white/20 border border-white/30",
    },
    loading: {
      false: "",
      true: "animate-spin cursor-wait",
    },
    variant: {
      dark: "bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700 focus:bg-gray-800 focus:ring-gray-500/20",
      default:
        "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 focus:bg-primary/90 focus:ring-primary/20",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80 focus:bg-destructive/90 focus:ring-destructive/20",
      ghost:
        "hover:bg-accent hover:text-accent-foreground active:bg-accent/80 focus:bg-accent focus:ring-accent/20",
      gradient:
        "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 active:from-purple-700 active:to-pink-700 focus:ring-purple-500/20",
      "gradient-blue":
        "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 focus:ring-blue-500/20",
      "gradient-green":
        "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 focus:ring-green-500/20",
      info: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:bg-blue-700 focus:ring-blue-500/20",
      light:
        "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 active:bg-gray-100 focus:bg-gray-50 focus:ring-gray-500/20",
      link: "text-primary underline-offset-4 hover:underline active:text-primary/80 focus:text-primary/90 focus:ring-primary/20",
      outline:
        "border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/80 focus:bg-accent focus:ring-accent/20",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70 focus:bg-secondary/80 focus:ring-secondary/20",
      success:
        "bg-green-600 text-white hover:bg-green-700 active:bg-green-800 focus:bg-green-700 focus:ring-green-500/20",
      warning:
        "bg-yellow-600 text-white hover:bg-yellow-700 active:bg-yellow-800 focus:bg-yellow-700 focus:ring-yellow-500/20",
    },
  },
};

export const extendsTestProps = [
  {},
  { variant: "destructive" },
  { size: "lg", variant: "outline" },
  { size: "sm", variant: "secondary" },
  { disabled: true, variant: "ghost" },
  { disabled: false, size: "lg", variant: "link" },
  { rounded: "full", shadow: "xl", size: "xl", variant: "success" },
  { animation: "pulse", glass: true, size: "xs", variant: "warning" },
  { loading: true, shadow: "lg", variant: "info" },
  { animation: "scale", rounded: "xl", size: "lg", variant: "gradient" },
  { glass: true, rounded: "sm", shadow: "md", variant: "gradient-blue" },
  { animation: "bounce", disabled: false, size: "sm", variant: "dark" },
  { loading: false, rounded: "none", shadow: "sm", variant: "light" },
];
