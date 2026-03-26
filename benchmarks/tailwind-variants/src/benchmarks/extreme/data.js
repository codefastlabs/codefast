/**
 * Extreme Benchmark Data
 *
 * Stress test data with maximum complexity to push libraries to their limits:
 * - 100+ variant options
 * - 50+ compound variants
 * - Deep slot nesting
 * - Heavy class strings
 */

// Generate a large number of color variants dynamically
const generateColorVariants = () => {
  const colors = [
    "slate",
    "gray",
    "zinc",
    "neutral",
    "stone",
    "red",
    "orange",
    "amber",
    "yellow",
    "lime",
    "green",
    "emerald",
    "teal",
    "cyan",
    "sky",
    "blue",
    "indigo",
    "violet",
    "purple",
    "fuchsia",
    "pink",
    "rose",
  ];
  const shades = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];

  const variants = {};
  for (const color of colors) {
    for (const shade of shades) {
      const key = `${color}-${shade}`;
      variants[key] =
        `bg-${color}-${shade} text-${color === "yellow" || shade <= "300" ? "gray-900" : "white"} hover:bg-${color}-${Number(shade) + 100 > 950 ? 950 : Number(shade) + 100} active:bg-${color}-${Number(shade) + 200 > 950 ? 950 : Number(shade) + 200} focus:ring-${color}-500/20 border-${color}-${shade}`;
    }
  }
  return variants;
};

// Generate size variants with many options
const generateSizeVariants = () => {
  const sizes = {};
  for (let i = 1; i <= 20; i++) {
    sizes[`size-${i}`] =
      `h-${i * 2} px-${i} py-${Math.ceil(i / 2)} text-${i <= 4 ? "xs" : i <= 8 ? "sm" : i <= 12 ? "base" : i <= 16 ? "lg" : "xl"} min-w-${i * 2} gap-${Math.ceil(i / 4)}`;
  }
  return sizes;
};

// Generate compound variants with complex conditions
const generateCompoundVariants = () => {
  const compounds = [];
  const colors = ["red", "blue", "green", "yellow", "purple", "pink", "cyan", "orange"];
  const states = ["hover", "active", "disabled", "loading", "selected"];

  // Size + Color combinations
  for (let size = 1; size <= 10; size++) {
    for (const color of colors.slice(0, 5)) {
      compounds.push({
        class: `shadow-${color}-500/25 ring-${color}-500/20 transform scale-${100 + size}`,
        color: `${color}-500`,
        size: `size-${size}`,
      });
    }
  }

  // State combinations
  for (const state1 of states) {
    for (const state2 of states) {
      if (state1 !== state2) {
        compounds.push({
          [state1]: true,
          [state2]: true,
          class: `${state1}-${state2}-combined opacity-${state1 === "disabled" ? 50 : 100} cursor-${state2 === "loading" ? "wait" : "pointer"}`,
        });
      }
    }
  }

  return compounds;
};

export const extremeVariants = {
  base: "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background select-none cursor-pointer antialiased transform-gpu backface-hidden will-change-transform font-sans tracking-tight leading-none whitespace-nowrap overflow-hidden text-ellipsis relative isolate",
  compoundVariants: generateCompoundVariants(),
  defaultVariants: {
    active: false,
    animation: "none",
    color: "blue-500",
    disabled: false,
    elevation: "md",
    glass: false,
    gradient: "none",
    hover: false,
    loading: false,
    outline: false,
    rounded: "md",
    selected: false,
    shadow: "md",
    size: "size-5",
  },
  variants: {
    active: {
      false: "",
      true: "ring-2 ring-offset-2 ring-primary z-10",
    },
    animation: {
      bounce: "animate-bounce",
      fade: "animate-fade-in",
      none: "",
      ping: "animate-ping",
      pulse: "animate-pulse",
      shake: "animate-shake",
      slide: "animate-slide-in",
      spin: "animate-spin",
      wiggle: "animate-wiggle",
      zoom: "animate-zoom-in",
    },
    color: generateColorVariants(),
    disabled: {
      false: "",
      true: "opacity-50 pointer-events-none cursor-not-allowed grayscale saturate-0",
    },
    elevation: {
      "2xl": "shadow-2xl ring-1 ring-black/5",
      inner: "shadow-inner",
      lg: "shadow-lg ring-1 ring-black/5",
      md: "shadow-md",
      none: "shadow-none",
      sm: "shadow-sm",
      xl: "shadow-xl ring-1 ring-black/5",
    },
    glass: {
      false: "",
      true: "backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl",
    },
    gradient: {
      "blue-purple": "bg-linear-to-r from-blue-500 to-purple-600",
      "cyan-blue": "bg-linear-to-r from-cyan-400 to-blue-500",
      "green-blue": "bg-linear-to-r from-green-400 to-blue-500",
      none: "",
      "orange-red": "bg-linear-to-r from-orange-500 to-red-600",
      "pink-purple": "bg-linear-to-r from-pink-500 to-purple-600",
      "purple-pink": "bg-linear-to-r from-purple-500 to-pink-500",
      rainbow:
        "bg-linear-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500",
      sunset: "bg-linear-to-r from-orange-400 via-pink-500 to-purple-600",
      "teal-green": "bg-linear-to-r from-teal-400 to-green-500",
      "yellow-orange": "bg-linear-to-r from-yellow-400 to-orange-500",
    },
    hover: {
      false: "",
      true: "hover:scale-105 hover:shadow-lg hover:brightness-110",
    },
    loading: {
      false: "",
      true: "animate-pulse cursor-wait pointer-events-none",
    },
    outline: {
      false: "",
      true: "bg-transparent border-2 hover:bg-current/10",
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
    selected: {
      false: "",
      true: "ring-2 ring-primary ring-offset-2 bg-primary/10",
    },
    shadow: {
      "2xl": "drop-shadow-2xl",
      colored: "shadow-lg shadow-current/25",
      glow: "shadow-lg shadow-current/50 blur-sm",
      lg: "drop-shadow-lg",
      md: "drop-shadow-md",
      none: "drop-shadow-none",
      sm: "drop-shadow-sm",
      xl: "drop-shadow-xl",
    },
    size: generateSizeVariants(),
  },
};

// Generate extreme test props covering many combinations
export const extremeTestProps = [
  {},
  { color: "red-500", size: "size-1" },
  { color: "blue-700", size: "size-10" },
  { color: "green-400", disabled: true, size: "size-5" },
  { animation: "pulse", color: "purple-600", loading: true },
  { color: "pink-500", glass: true, gradient: "pink-purple", size: "size-8" },
  { active: true, color: "cyan-500", elevation: "xl", hover: true, selected: true },
  { color: "amber-600", outline: true, rounded: "full", shadow: "glow", size: "size-12" },
  { animation: "bounce", color: "emerald-500", gradient: "green-blue", size: "size-3" },
  { color: "violet-700", disabled: false, glass: true, loading: false, size: "size-15" },
  { color: "rose-400", elevation: "2xl", gradient: "sunset", rounded: "3xl", shadow: "colored" },
  { active: true, animation: "wiggle", color: "teal-500", hover: true, size: "size-7" },
  { color: "indigo-600", gradient: "blue-purple", loading: true, outline: true, selected: true },
  {
    color: "orange-500",
    disabled: true,
    elevation: "inner",
    glass: true,
    rounded: "none",
    size: "size-20",
  },
  { animation: "zoom", color: "lime-400", gradient: "rainbow", shadow: "2xl", size: "size-1" },
  { color: "sky-500", hover: true, outline: true, rounded: "2xl", selected: false, size: "size-9" },
  {
    active: false,
    color: "fuchsia-600",
    disabled: false,
    elevation: "lg",
    glass: true,
    loading: false,
  },
  { animation: "slide", color: "stone-500", gradient: "none", shadow: "lg", size: "size-11" },
  { color: "zinc-700", hover: true, loading: true, outline: false, rounded: "xl", selected: true },
  {
    color: "neutral-400",
    disabled: true,
    elevation: "sm",
    glass: false,
    shadow: "sm",
    size: "size-4",
  },
];

// Slots variant for extreme testing
export const extremeSlotsVariants = {
  compoundSlots: [
    {
      className: "opacity-50 pointer-events-none",
      disabled: true,
      slots: ["trigger", "content", "header", "footer", "overlay"],
    },
    {
      className: "animate-pulse cursor-wait",
      loading: true,
      slots: ["trigger", "content", "icon"],
    },
    {
      className: "backdrop-blur-xl bg-white/10",
      glass: true,
      slots: ["content", "header", "footer", "overlay"],
    },
    {
      className: "text-xs p-1 gap-0.5",
      size: "xs",
      slots: ["trigger", "title", "description", "action"],
    },
    {
      className: "text-sm p-2 gap-1",
      size: "sm",
      slots: ["trigger", "title", "description", "action"],
    },
    {
      className: "text-base p-4 gap-2",
      size: "md",
      slots: ["trigger", "title", "description", "action"],
    },
    {
      className: "text-lg p-6 gap-3",
      size: "lg",
      slots: ["trigger", "title", "description", "action"],
    },
    {
      className: "text-xl p-8 gap-4",
      size: "xl",
      slots: ["trigger", "title", "description", "action"],
    },
    {
      className: "rounded-none",
      rounded: "none",
      slots: ["trigger", "content", "header", "footer"],
    },
    { className: "rounded-full", rounded: "full", slots: ["trigger", "icon", "badge"] },
    { className: "shadow-2xl", elevation: "2xl", slots: ["content", "overlay"] },
    { className: "border-2 border-primary", variant: "outline", slots: ["trigger", "content"] },
    {
      className: "bg-destructive text-destructive-foreground",
      variant: "destructive",
      slots: ["trigger", "header", "title"],
    },
    { className: "ring-2 ring-primary", selected: true, slots: ["trigger", "content"] },
    { className: "scale-105 shadow-lg", hovered: true, slots: ["trigger", "content"] },
  ],
  defaultVariants: {
    disabled: false,
    elevation: "md",
    glass: false,
    hovered: false,
    loading: false,
    rounded: "md",
    selected: false,
    size: "md",
    variant: "default",
  },
  slots: {
    action:
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2",
    badge: "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
    close:
      "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2",
    content:
      "relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200",
    description: "text-sm text-muted-foreground",
    footer: "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
    header: "flex flex-col space-y-1.5 text-center sm:text-left",
    icon: "h-4 w-4 shrink-0",
    overlay: "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-all duration-200",
    separator: "shrink-0 bg-border h-px w-full",
    title: "text-lg font-semibold leading-none tracking-tight",
    trigger:
      "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  },
  variants: {
    disabled: {
      false: "",
      true: {
        action: "pointer-events-none opacity-50",
        close: "pointer-events-none opacity-50",
        content: "pointer-events-none",
        trigger: "pointer-events-none opacity-50 cursor-not-allowed",
      },
    },
    elevation: {
      "2xl": { content: "shadow-2xl", overlay: "backdrop-blur-md" },
      lg: { content: "shadow-lg" },
      md: { content: "shadow-md" },
      none: { content: "shadow-none" },
      sm: { content: "shadow-sm" },
      xl: { content: "shadow-xl", overlay: "backdrop-blur-sm" },
    },
    glass: {
      false: "",
      true: {
        content: "backdrop-blur-xl bg-white/20 border-white/30",
        footer: "backdrop-blur-sm bg-white/10",
        header: "backdrop-blur-sm bg-white/10",
        overlay: "backdrop-blur-md bg-black/40",
      },
    },
    hovered: {
      false: "",
      true: {
        content: "scale-[1.02] shadow-xl",
        trigger: "bg-accent text-accent-foreground",
      },
    },
    loading: {
      false: "",
      true: {
        action: "animate-pulse",
        content: "animate-pulse",
        trigger: "animate-pulse cursor-wait",
      },
    },
    rounded: {
      "2xl": { content: "rounded-2xl", trigger: "rounded-2xl" },
      full: { badge: "rounded-full", trigger: "rounded-full" },
      lg: { content: "rounded-lg", trigger: "rounded-lg" },
      md: { content: "rounded-md", trigger: "rounded-md" },
      none: { content: "rounded-none", trigger: "rounded-none" },
      sm: { content: "rounded-sm", trigger: "rounded-sm" },
      xl: { content: "rounded-xl", trigger: "rounded-xl" },
    },
    selected: {
      false: "",
      true: {
        content: "ring-2 ring-primary ring-offset-2",
        trigger: "ring-2 ring-primary",
      },
    },
    size: {
      lg: {
        action: "h-11 px-8 text-base",
        content: "max-w-2xl p-8 gap-6",
        description: "text-base",
        icon: "h-6 w-6",
        title: "text-2xl",
        trigger: "h-11 px-6 text-base",
      },
      md: {
        action: "h-10 px-4",
        content: "max-w-lg p-6 gap-4",
        trigger: "h-10 px-4",
      },
      sm: {
        action: "h-9 px-3 text-sm",
        content: "max-w-md p-4 gap-3",
        description: "text-xs",
        icon: "h-3.5 w-3.5",
        title: "text-base",
        trigger: "h-9 px-3 text-sm",
      },
      xl: {
        action: "h-12 px-10 text-lg",
        content: "max-w-3xl p-10 gap-8",
        description: "text-lg",
        icon: "h-8 w-8",
        title: "text-3xl",
        trigger: "h-12 px-8 text-lg",
      },
      xs: {
        action: "h-8 px-2 text-xs",
        content: "max-w-sm p-3 gap-2",
        description: "text-xs",
        icon: "h-3 w-3",
        title: "text-sm",
        trigger: "h-8 px-2 text-xs",
      },
    },
    variant: {
      default: "",
      destructive: {
        action: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        content: "border-destructive",
        header: "text-destructive",
        title: "text-destructive",
        trigger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      ghost: {
        action: "hover:bg-accent hover:text-accent-foreground",
        trigger: "hover:bg-accent hover:text-accent-foreground",
      },
      outline: {
        action: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        content: "border-2",
        trigger: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      },
      secondary: {
        action: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        trigger: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      },
    },
  },
};

export const extremeSlotsTestProps = [
  {},
  { size: "xs", variant: "default" },
  { size: "sm", variant: "outline" },
  { size: "md", variant: "secondary" },
  { size: "lg", variant: "destructive" },
  { size: "xl", variant: "ghost" },
  { disabled: true, size: "md" },
  { loading: true, size: "sm" },
  { glass: true, size: "lg", variant: "outline" },
  { elevation: "2xl", rounded: "xl", size: "xl" },
  { hovered: true, selected: true, size: "md" },
  { disabled: false, glass: true, loading: false, variant: "destructive" },
  { elevation: "lg", glass: true, rounded: "full", selected: true, size: "sm" },
  { disabled: true, elevation: "none", loading: true, rounded: "none", variant: "secondary" },
  { glass: true, hovered: true, rounded: "2xl", size: "xs", variant: "ghost" },
];
