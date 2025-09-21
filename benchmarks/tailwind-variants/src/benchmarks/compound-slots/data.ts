/**
 * Compound Slots Benchmark Data
 *
 * Data specific to compound slots variant benchmarks
 */

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
];
