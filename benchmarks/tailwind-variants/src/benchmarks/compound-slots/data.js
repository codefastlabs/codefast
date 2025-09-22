/**
 * Compound Slots Benchmark Data
 *
 * Data specific to compound slots variant benchmarks
 */

export const compoundSlotsVariants = {
  compoundSlots: [
    {
      className: "w-6 h-6 text-xs min-w-6 gap-0.5 shadow-sm",
      size: "xs",
      slots: ["item", "prev", "next", "cursor"],
    },
    {
      className: "w-8 h-8 text-sm min-w-8 gap-1 shadow-sm",
      size: "sm",
      slots: ["item", "prev", "next", "cursor"],
    },
    {
      className: "w-9 h-9 text-base min-w-9 gap-1.5 shadow-md",
      size: "md",
      slots: ["item", "prev", "next", "cursor"],
    },
    {
      className: "w-10 h-10 text-lg min-w-10 gap-2 shadow-lg",
      size: "lg",
      slots: ["item", "prev", "next", "cursor"],
    },
    {
      className: "w-12 h-12 text-xl min-w-12 gap-2.5 shadow-xl",
      size: "xl",
      slots: ["item", "prev", "next", "cursor"],
    },
    {
      className:
        "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 focus:ring-blue-500/20",
      color: "primary",
      slots: ["item", "prev", "next"],
    },
    {
      className:
        "bg-gray-500 text-white hover:bg-gray-600 active:bg-gray-700 focus:ring-gray-500/20",
      color: "secondary",
      slots: ["item", "prev", "next"],
    },
    {
      className:
        "bg-green-500 text-white hover:bg-green-600 active:bg-green-700 focus:ring-green-500/20",
      color: "success",
      slots: ["item", "prev", "next"],
    },
    {
      className: "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 focus:ring-red-500/20",
      color: "danger",
      slots: ["item", "prev", "next"],
    },
    {
      className:
        "bg-yellow-500 text-white hover:bg-yellow-600 active:bg-yellow-700 focus:ring-yellow-500/20",
      color: "warning",
      slots: ["item", "prev", "next"],
    },
    {
      className:
        "bg-purple-500 text-white hover:bg-purple-600 active:bg-purple-700 focus:ring-purple-500/20",
      color: "info",
      slots: ["item", "prev", "next"],
    },
    {
      className:
        "bg-gradient-to-r from-pink-500 to-violet-500 text-white hover:from-pink-600 hover:to-violet-600",
      color: "gradient",
      slots: ["item", "prev", "next"],
    },
    {
      className: "opacity-50 pointer-events-none cursor-not-allowed grayscale",
      disabled: true,
      slots: ["item", "prev", "next", "cursor"],
    },
    {
      className: "rounded-full",
      rounded: "full",
      slots: ["item", "prev", "next"],
    },
    {
      className: "rounded-none",
      rounded: "none",
      slots: ["item", "prev", "next"],
    },
    {
      className: "animate-pulse",
      loading: true,
      slots: ["item", "prev", "next", "cursor"],
    },
    {
      className: "backdrop-blur-md bg-white/20 border border-white/30",
      glass: true,
      slots: ["base", "item", "prev", "next"],
    },
  ],
  defaultVariants: {
    color: "primary",
    disabled: false,
    glass: false,
    loading: false,
    rounded: "md",
    shadow: "sm",
    size: "md",
  },
  slots: {
    base: "flex flex-wrap relative gap-1 max-w-fit items-center justify-center transition-all duration-200",
    cursor: "absolute flex overflow-visible z-10 pointer-events-none",
    ellipsis: "flex items-center justify-center text-muted-foreground",
    item: "inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none",
    next: "inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none",
    prev: "inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none",
    separator: "flex items-center justify-center text-muted-foreground",
  },
  variants: {
    color: {
      danger: {
        item: "text-red-600 hover:text-red-700 hover:bg-red-50 active:bg-red-100",
        next: "text-red-600 hover:text-red-700 hover:bg-red-50 active:bg-red-100",
        prev: "text-red-600 hover:text-red-700 hover:bg-red-50 active:bg-red-100",
      },
      gradient: {
        item: "bg-gradient-to-r from-pink-500 to-violet-500 text-white hover:from-pink-600 hover:to-violet-600",
        next: "bg-gradient-to-r from-pink-500 to-violet-500 text-white hover:from-pink-600 hover:to-violet-600",
        prev: "bg-gradient-to-r from-pink-500 to-violet-500 text-white hover:from-pink-600 hover:to-violet-600",
      },
      info: {
        item: "text-purple-600 hover:text-purple-700 hover:bg-purple-50 active:bg-purple-100",
        next: "text-purple-600 hover:text-purple-700 hover:bg-purple-50 active:bg-purple-100",
        prev: "text-purple-600 hover:text-purple-700 hover:bg-purple-50 active:bg-purple-100",
      },
      primary: {
        item: "text-blue-600 hover:text-blue-700 hover:bg-blue-50 active:bg-blue-100",
        next: "text-blue-600 hover:text-blue-700 hover:bg-blue-50 active:bg-blue-100",
        prev: "text-blue-600 hover:text-blue-700 hover:bg-blue-50 active:bg-blue-100",
      },
      secondary: {
        item: "text-gray-600 hover:text-gray-700 hover:bg-gray-50 active:bg-gray-100",
        next: "text-gray-600 hover:text-gray-700 hover:bg-gray-50 active:bg-gray-100",
        prev: "text-gray-600 hover:text-gray-700 hover:bg-gray-50 active:bg-gray-100",
      },
      success: {
        item: "text-green-600 hover:text-green-700 hover:bg-green-50 active:bg-green-100",
        next: "text-green-600 hover:text-green-700 hover:bg-green-50 active:bg-green-100",
        prev: "text-green-600 hover:text-green-700 hover:bg-green-50 active:bg-green-100",
      },
      warning: {
        item: "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 active:bg-yellow-100",
        next: "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 active:bg-yellow-100",
        prev: "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 active:bg-yellow-100",
      },
    },
    disabled: {
      false: "",
      true: {
        base: "opacity-50 pointer-events-none",
        item: "cursor-not-allowed",
        next: "cursor-not-allowed",
        prev: "cursor-not-allowed",
      },
    },
    glass: {
      false: "",
      true: {
        base: "backdrop-blur-md bg-white/10 border border-white/20",
        item: "backdrop-blur-sm",
        next: "backdrop-blur-sm",
        prev: "backdrop-blur-sm",
      },
    },
    loading: {
      false: "",
      true: {
        cursor: "animate-pulse",
        item: "animate-pulse cursor-wait",
        next: "animate-pulse cursor-wait",
        prev: "animate-pulse cursor-wait",
      },
    },
    rounded: {
      full: {
        item: "rounded-full",
        next: "rounded-full",
        prev: "rounded-full",
      },
      lg: {
        item: "rounded-lg",
        next: "rounded-lg",
        prev: "rounded-lg",
      },
      md: {
        item: "rounded-md",
        next: "rounded-md",
        prev: "rounded-md",
      },
      none: {
        item: "rounded-none",
        next: "rounded-none",
        prev: "rounded-none",
      },
      sm: {
        item: "rounded-sm",
        next: "rounded-sm",
        prev: "rounded-sm",
      },
      xl: {
        item: "rounded-xl",
        next: "rounded-xl",
        prev: "rounded-xl",
      },
    },
    shadow: {
      lg: {
        base: "shadow-lg",
      },
      md: {
        base: "shadow-md",
      },
      none: "",
      sm: {
        base: "shadow-sm",
      },
      xl: {
        base: "shadow-xl",
      },
    },
    size: {
      lg: {
        item: "px-3 py-2 text-base min-h-10 min-w-10",
        next: "px-3 py-2 text-base min-h-10 min-w-10",
        prev: "px-3 py-2 text-base min-h-10 min-w-10",
      },
      md: {
        item: "px-2.5 py-1.5 text-sm min-h-9 min-w-9",
        next: "px-2.5 py-1.5 text-sm min-h-9 min-w-9",
        prev: "px-2.5 py-1.5 text-sm min-h-9 min-w-9",
      },
      sm: {
        item: "px-2 py-1 text-sm min-h-8 min-w-8",
        next: "px-2 py-1 text-sm min-h-8 min-w-8",
        prev: "px-2 py-1 text-sm min-h-8 min-w-8",
      },
      xl: {
        item: "px-4 py-3 text-lg min-h-12 min-w-12",
        next: "px-4 py-3 text-lg min-h-12 min-w-12",
        prev: "px-4 py-3 text-lg min-h-12 min-w-12",
      },
      xs: {
        item: "px-1.5 py-0.5 text-xs min-h-6 min-w-6",
        next: "px-1.5 py-0.5 text-xs min-h-6 min-w-6",
        prev: "px-1.5 py-0.5 text-xs min-h-6 min-w-6",
      },
    },
  },
};

export const compoundSlotsTestProps = [
  {},
  { color: "primary", size: "xs" },
  { color: "secondary", size: "sm" },
  { color: "success", size: "md" },
  { color: "danger", size: "lg" },
  { disabled: true },
  { color: "primary", disabled: true, size: "xs" },
  { color: "danger", disabled: false, size: "lg" },
  { color: "warning", rounded: "full", shadow: "xl", size: "xl" },
  { color: "info", glass: true, loading: true, size: "sm" },
  { color: "gradient", rounded: "none", shadow: "lg" },
  { glass: true, rounded: "xl", size: "xs" },
  { color: "success", loading: true, rounded: "sm", shadow: "md" },
  { color: "primary", disabled: false, glass: true, size: "lg" },
];
