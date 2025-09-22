/**
 * Slots Benchmark Data
 *
 * Data specific to slots variant benchmarks
 */

export const slotsVariants = {
  defaultVariants: {
    animation: "none",
    elevation: "sm",
    rounded: "lg",
    size: "md",
    variant: "default",
  },
  slots: {
    actions: "flex items-center gap-2",
    badge: "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
    base: "rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200 relative overflow-hidden",
    content: "p-6 pt-0 space-y-4",
    description: "text-sm text-muted-foreground leading-relaxed",
    footer: "flex items-center justify-between p-6 pt-0 border-t border-border/50 bg-muted/20",
    header:
      "flex flex-col space-y-1.5 p-6 border-b border-border/50 bg-gradient-to-r from-background to-muted/10",
    icon: "h-5 w-5 shrink-0",
    image: "w-full h-48 object-cover",
    title: "text-2xl font-semibold leading-none tracking-tight flex items-center gap-2",
  },
  variants: {
    animation: {
      bounce: {
        base: "hover:animate-bounce",
      },
      fade: {
        base: "hover:opacity-80 transition-opacity",
      },
      none: "",
      pulse: {
        base: "animate-pulse",
      },
      scale: {
        base: "hover:scale-105 transition-transform",
      },
      slide: {
        base: "hover:translate-x-1 transition-transform",
      },
    },
    elevation: {
      "2xl": {
        base: "shadow-2xl",
      },
      inner: {
        base: "shadow-inner",
      },
      lg: {
        base: "shadow-lg",
      },
      md: {
        base: "shadow-md",
      },
      none: {
        base: "shadow-none",
      },
      sm: {
        base: "shadow-sm",
      },
      xl: {
        base: "shadow-xl",
      },
    },
    rounded: {
      "2xl": {
        base: "rounded-2xl",
        image: "rounded-t-2xl",
      },
      "3xl": {
        base: "rounded-3xl",
        image: "rounded-t-3xl",
      },
      lg: {
        base: "rounded-lg",
        image: "rounded-t-lg",
      },
      md: {
        base: "rounded-md",
        image: "rounded-t-md",
      },
      none: {
        base: "rounded-none",
        image: "rounded-none",
      },
      sm: {
        base: "rounded-sm",
        image: "rounded-t-sm",
      },
      xl: {
        base: "rounded-xl",
        image: "rounded-t-xl",
      },
    },
    size: {
      lg: {
        base: "text-lg max-w-lg",
        content: "p-8 pt-0 space-y-6",
        description: "text-base",
        footer: "p-8 pt-0",
        header: "p-8",
        image: "h-64",
        title: "text-3xl font-bold",
      },
      md: {
        base: "max-w-md",
        content: "p-6 pt-0 space-y-4",
        description: "text-sm",
        footer: "p-6 pt-0",
        header: "p-6",
        image: "h-48",
        title: "text-2xl font-semibold",
      },
      sm: {
        base: "text-sm max-w-sm",
        content: "p-3 pt-0 space-y-2",
        description: "text-xs",
        footer: "p-3 pt-0",
        header: "p-3",
        image: "h-32",
        title: "text-lg font-medium",
      },
      xl: {
        base: "text-xl max-w-xl",
        content: "p-10 pt-0 space-y-8",
        description: "text-lg",
        footer: "p-10 pt-0",
        header: "p-10",
        image: "h-80",
        title: "text-4xl font-bold",
      },
      xs: {
        base: "text-xs max-w-xs",
        content: "p-2 pt-0 space-y-1",
        description: "text-xs",
        footer: "p-2 pt-0",
        header: "p-2",
        image: "h-24",
        title: "text-sm font-medium",
      },
    },
    variant: {
      default: "",
      destructive: {
        badge: "bg-destructive text-destructive-foreground",
        base: "border-destructive bg-destructive/5",
        header: "text-destructive bg-gradient-to-r from-destructive/10 to-destructive/5",
        title: "text-destructive",
      },
      glass: {
        base: "backdrop-blur-md bg-white/20 border-white/30 shadow-xl",
        footer: "backdrop-blur-sm bg-white/10",
        header: "backdrop-blur-sm bg-white/10",
      },
      gradient: {
        badge: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
        base: "border-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20",
        header: "text-white bg-gradient-to-r from-purple-600 to-pink-600",
        title: "text-white",
      },
      info: {
        badge: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
        base: "border-blue-500 bg-blue-50 dark:bg-blue-950/20",
        header:
          "text-blue-700 dark:text-blue-300 bg-gradient-to-r from-blue-100/50 to-blue-50 dark:from-blue-900/50 dark:to-blue-950/20",
        title: "text-blue-700 dark:text-blue-300",
      },
      success: {
        badge: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
        base: "border-green-500 bg-green-50 dark:bg-green-950/20",
        header:
          "text-green-700 dark:text-green-300 bg-gradient-to-r from-green-100/50 to-green-50 dark:from-green-900/50 dark:to-green-950/20",
        title: "text-green-700 dark:text-green-300",
      },
      warning: {
        badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
        base: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20",
        header:
          "text-yellow-700 dark:text-yellow-300 bg-gradient-to-r from-yellow-100/50 to-yellow-50 dark:from-yellow-900/50 dark:to-yellow-950/20",
        title: "text-yellow-700 dark:text-yellow-300",
      },
    },
  },
};

export const slotsTestProps = [
  {},
  { variant: "destructive" },
  { size: "lg", variant: "success" },
  { size: "sm" },
  { size: "sm", variant: "destructive" },
  { size: "lg", variant: "success" },
  { elevation: "lg", rounded: "xl", size: "xs", variant: "warning" },
  { animation: "scale", elevation: "2xl", size: "xl", variant: "info" },
  { animation: "pulse", rounded: "3xl", variant: "gradient" },
  { animation: "fade", elevation: "xl", size: "sm", variant: "glass" },
  { animation: "bounce", elevation: "inner", rounded: "none", variant: "success" },
  { animation: "slide", rounded: "2xl", size: "lg", variant: "warning" },
];
