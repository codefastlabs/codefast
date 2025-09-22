/**
 * Create TV Benchmark Data
 *
 * Data specific to create-tv benchmarks
 */

export const buttonVariants = {
  base: "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background select-none cursor-pointer antialiased transform-gpu",
  defaultVariants: {
    animation: "none",
    elevation: "none",
    fullWidth: false,
    loading: false,
    rounded: "md",
    size: "default",
    variant: "default",
  },
  variants: {
    animation: {
      bounce: "hover:animate-bounce",
      fade: "hover:opacity-80 transition-opacity",
      none: "",
      pulse: "animate-pulse",
      scale: "hover:scale-105 transition-transform",
      shake: "hover:animate-wiggle",
      spin: "animate-spin",
    },
    elevation: {
      lg: "shadow-lg hover:shadow-xl transition-shadow",
      md: "shadow-md hover:shadow-lg transition-shadow",
      none: "",
      sm: "shadow-sm hover:shadow-md transition-shadow",
      xl: "shadow-xl hover:shadow-2xl transition-shadow",
    },
    fullWidth: {
      false: "",
      true: "w-full",
    },
    loading: {
      false: "",
      true: "animate-spin cursor-wait",
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
    size: {
      "2xl": "h-14 px-12 py-5 text-xl min-w-14 gap-3",
      default: "h-10 px-4 py-2 text-sm min-w-10 gap-2",
      icon: "h-10 w-10 p-0",
      "icon-lg": "h-12 w-12 p-0",
      "icon-sm": "h-8 w-8 p-0",
      "icon-xl": "h-14 w-14 p-0",
      "icon-xs": "h-6 w-6 p-0",
      lg: "h-11 px-8 py-3 text-base min-w-11 gap-2",
      sm: "h-9 px-3 py-2 text-sm min-w-9 gap-1.5",
      xl: "h-12 px-10 py-4 text-lg min-w-12 gap-2.5",
      xs: "h-8 px-2 py-1 text-xs min-w-8 gap-1",
    },
    variant: {
      dark: "bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700 focus:bg-gray-800 focus:ring-gray-500/20",
      default:
        "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 focus:bg-primary/90 focus:ring-primary/20",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80 focus:bg-destructive/90 focus:ring-destructive/20",
      ghost:
        "hover:bg-accent hover:text-accent-foreground active:bg-accent/80 focus:bg-accent focus:ring-accent/20",
      glass:
        "backdrop-blur-md bg-white/20 border border-white/30 text-white hover:bg-white/30 focus:ring-white/20",
      gradient:
        "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 active:from-purple-700 active:to-pink-700 focus:ring-purple-500/20",
      "gradient-blue":
        "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 focus:ring-blue-500/20",
      "gradient-green":
        "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 focus:ring-green-500/20",
      "gradient-orange":
        "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 focus:ring-orange-500/20",
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

export const simpleTestProps = [
  {},
  { variant: "destructive" },
  { size: "lg" },
  { className: "custom-class", size: "sm", variant: "outline" },
  { size: "icon", variant: "ghost" },
  { className: "custom-class", variant: "link" },
  { elevation: "xl", rounded: "full", size: "xl", variant: "success" },
  { animation: "pulse", fullWidth: true, size: "xs", variant: "warning" },
  { elevation: "lg", loading: true, rounded: "2xl", variant: "info" },
  { animation: "scale", elevation: "md", size: "2xl", variant: "gradient" },
  { fullWidth: false, rounded: "3xl", variant: "gradient-blue" },
  { animation: "bounce", size: "icon-xl", variant: "dark" },
  { elevation: "sm", loading: false, variant: "gradient-green" },
  { animation: "fade", rounded: "xl", size: "icon-xs", variant: "glass" },
  { elevation: "none", fullWidth: true, variant: "gradient-orange" },
];
