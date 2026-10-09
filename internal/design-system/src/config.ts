/** The design system's name, as the artifact and its cover spell it. */
export const SYSTEM_NAME = "Codefast UI";

/** The global the component bundle assigns. */
export const NAMESPACE = "CodefastUI";

/** The `@codefast/ui` palette the tokens are read from — the one codefastlabs.com ships. */
export const PALETTE = "sky";

/** The asset groups in the order the page shows them, with the tile size each group's files get. */
export const ASSET_GROUPS: Array<{ name: string; tile: "l" | "m" | "s" | "xs" }> = [
  { name: "Logos", tile: "l" },
  { name: "Icons", tile: "xs" },
];

/** The ink the exported icon files are drawn in, since an `<img>` cannot inherit `currentColor`. */
export const ICON_INK = "#18181b";

// ── Color usage ──────────────────────────────────────────────────────────────────────────────────────────────────────

/** Where each semantic color is spent; the palette swatches and any contrast shortfall are appended at build time. */
export const COLOR_USAGE: Record<string, string> = {
  background: "Page and app background. `foreground` reads on it.",
  foreground:
    "Default text on `background`, `card` and `popover`; also the Tooltip fill (inverted, with `background` as its text).",
  primary:
    "The one brand action fill: default Button, checked Checkbox/Switch/Radio, Slider range, Progress. One hue in both schemes.",
  "primary-foreground": "Text and icons on `primary`.",
  secondary: "Low-emphasis fill: secondary Button, secondary Badge, secondary chat Bubble.",
  "secondary-foreground": "Text on `secondary`.",
  destructive:
    "Errors and irreversible actions: destructive Button and Badge (as a 10–20% tint with this as text), invalid field rings, error Alert text. Never a fill behind white body text.",
  muted:
    "Quiet fills: Skeleton, Progress and Slider track, Avatar fallback, ghost Button hover, Toggle on, table and Kbd backgrounds, dialog footers.",
  "muted-foreground":
    "Secondary copy on `background`, `card`, `muted`: descriptions, placeholders, helper text, shortcuts.",
  accent: "Highlighted menu rows: DropdownMenu, ContextMenu, Menubar and Select items on focus.",
  "accent-foreground": "Text on `accent`.",
  popover:
    "Floating and modal surfaces: Popover, DropdownMenu, ContextMenu, Menubar, Select, HoverCard, Command, Dialog, AlertDialog, Sheet, Drawer.",
  "popover-foreground": "Text on `popover`.",
  card: "Card, Alert and Attachment surfaces.",
  "card-foreground": "Text on `card`.",
  border: "Every default border and divider (`*` gets it as border-color): Card, Separator, Table rows, menus.",
  input: "Form control borders and inset rings: Input, Textarea, Select trigger, Checkbox, Radio, Switch track off.",
  ring: "Focus ring colour; controls draw it as a solid border plus a 3px halo at 50% (`focus-visible:ring-ring/50`).",
  sidebar: "Sidebar surface.",
  "sidebar-foreground": "Text on `sidebar`.",
  "sidebar-primary": "Active/brand item fill inside Sidebar.",
  "sidebar-primary-foreground": "Text on `sidebar-primary`.",
  "sidebar-accent": "Sidebar menu item hover and active background.",
  "sidebar-accent-foreground": "Text on `sidebar-accent`.",
  "sidebar-border": "Sidebar edge and group separators.",
  "sidebar-ring": "Focus ring inside Sidebar.",
  "chart-1": "Chart series 1.",
  "chart-2": "Chart series 2.",
  "chart-3": "Chart series 3.",
  "chart-4": "Chart series 4.",
  "chart-5": "Chart series 5.",
};

/** A text or mark color and the ground it must read on, with the WCAG minimum it is held to. */
export interface ContrastPair {
  ground: string;
  ink: string;
  minimum: number;
  role: string;
}

/** The pairs checked in every scheme; a shortfall is flagged on the ink's token and in the brand book, never re-tinted. */
export const CONTRAST_PAIRS: Array<ContrastPair> = [
  { ground: "background", ink: "foreground", minimum: 4.5, role: "body text" },
  { ground: "background", ink: "muted-foreground", minimum: 4.5, role: "secondary text" },
  { ground: "muted", ink: "muted-foreground", minimum: 4.5, role: "secondary text" },
  { ground: "primary", ink: "primary-foreground", minimum: 4.5, role: "text" },
  { ground: "secondary", ink: "secondary-foreground", minimum: 4.5, role: "text" },
  { ground: "accent", ink: "accent-foreground", minimum: 4.5, role: "text" },
  { ground: "card", ink: "card-foreground", minimum: 4.5, role: "text" },
  { ground: "popover", ink: "popover-foreground", minimum: 4.5, role: "text" },
  { ground: "background", ink: "destructive", minimum: 4.5, role: "error text" },
  { ground: "sidebar", ink: "sidebar-foreground", minimum: 4.5, role: "text" },
  { ground: "sidebar-primary", ink: "sidebar-primary-foreground", minimum: 4.5, role: "text" },
  { ground: "background", ink: "ring", minimum: 3, role: "a focus indicator" },
];

// ── Type styles ──────────────────────────────────────────────────────────────────────────────────────────────────────

/** A text style named by role, spelled as the Tailwind utilities the components put on it. */
export interface TypeStyleSpec {
  leading?: string;
  name: string;
  sample: string;
  size: string;
  tracking?: string;
  usage: string;
  weight: string;
}

/** The text styles the components use, grouped as the Typography view shows them. */
export const TYPE_GROUPS: Array<{ family: "heading" | "mono" | "sans"; name: string; styles: Array<TypeStyleSpec> }> = [
  {
    family: "heading",
    name: "Headings",
    styles: [
      {
        leading: "snug",
        name: "title",
        sample: "Create project",
        size: "base",
        usage:
          "CardTitle, DialogTitle, SheetTitle, DrawerTitle, AlertDialogTitle: `font-heading text-base font-medium` (Dialog sets leading to 1).",
        weight: "medium",
      },
      {
        name: "title-sm",
        sample: "No results found",
        size: "sm",
        tracking: "tight",
        usage: 'EmptyTitle and `size="sm"` Card titles: `text-sm font-medium tracking-tight`.',
        weight: "medium",
      },
    ],
  },
  {
    family: "sans",
    name: "Text",
    styles: [
      {
        name: "body",
        sample: "Deploy your new project in one click.",
        size: "sm",
        usage: "Default UI copy (`text-sm`): descriptions, menu items, table cells, alert text.",
        weight: "normal",
      },
      {
        name: "label",
        sample: "Save changes",
        size: "sm",
        usage: "Button labels, Label, FieldLabel, Tabs triggers, AccordionTrigger: `text-sm font-medium`.",
        weight: "medium",
      },
      {
        name: "input",
        sample: "you@example.com",
        size: "base",
        usage:
          "Text typed into Input/Textarea/InputNumber below `md` (`text-base`), which keeps iOS from zooming; from `md` up it steps down to `body`.",
        weight: "normal",
      },
      {
        name: "legend",
        sample: "Billing address",
        size: "base",
        usage: 'FieldLegend `variant="legend"`: `text-base font-medium`.',
        weight: "medium",
      },
      {
        name: "caption",
        sample: "Beta",
        size: "xs",
        usage: "Badge, Kbd, small labels: `text-xs font-medium`.",
        weight: "medium",
      },
      {
        name: "shortcut",
        sample: "⌘K",
        size: "xs",
        tracking: "widest",
        usage: "Menu and Command shortcuts: `text-xs tracking-widest`, in `muted-foreground`.",
        weight: "normal",
      },
    ],
  },
  {
    family: "mono",
    name: "Mono",
    styles: [
      {
        name: "data",
        sample: "1,284.50",
        size: "xs",
        usage: "Chart tooltip values: `font-mono font-medium tabular-nums`.",
        weight: "medium",
      },
    ],
  },
];

// ── Scales ───────────────────────────────────────────────────────────────────────────────────────────────────────────

/** The spacing multiples the components use, each with where it shows up. */
export const SPACING_STEPS: Array<[step: number, usage: string]> = [
  [0.5, "Hairline offsets: badge padding, tight icon gaps."],
  [1, "Icon-to-label gap in compact controls; menu item vertical padding."],
  [1.5, "Gap inside buttons and menu items; label-to-field spacing (`mb-1.5`)."],
  [2, "The most-used step: control inner padding, row gaps, menu padding."],
  [2.5, "Horizontal padding of inputs and default buttons (`px-2.5`)."],
  [3, "Alert and Item padding; compact card padding."],
  [4, "Card and Dialog section padding; gap between form fields."],
  [6, "Card vertical rhythm (`py-6`/`gap-6`); dialog content gap."],
  [7, "Small control height (`h-7`, `size-7`): sm buttons, icon buttons."],
  [8, "Default control height (`h-8`): Button, Input, Select trigger, Toggle."],
  [9, "Large control height (`h-9`)."],
  [10, "Extra-large controls and avatar `lg`."],
];

/** Where each step of the radius scale is used. */
export const RADIUS_USAGE: Record<string, string> = {
  radius:
    "The base unit the whole radius scale derives from. Override it to round or square off every component at once.",
  "radius-xs": "Chart tooltip indicators and Tooltip arrow.",
  "radius-sm": "Checkbox box, Kbd, Command and Menubar items, small Item.",
  "radius-md": "DropdownMenu, ContextMenu and Select items; Skeleton; Tabs trigger; Tooltip.",
  "radius-lg":
    "The default control radius: Button, Input, Select, Textarea, Popover, DropdownMenu (`rounded-lg`, the most-used step).",
  "radius-xl": "Card, Dialog, AlertDialog, Command, Empty, chat Bubble and Attachment.",
  "radius-2xl": "Toast (Sonner).",
  "radius-3xl": "Not used by a component; the next step of the scale, for app surfaces.",
  "radius-4xl": "Badge pill.",
};

/** Tailwind's `rounded-full`, which the scale does not derive. */
export const RADIUS_FULL = {
  name: "radius-full",
  usage: "Avatar, Switch track and thumb, Radio, Spinner, ProgressCircle (Tailwind `rounded-full`).",
  value: "9999px",
};

/** The Tailwind shadows the components use, each with where it shows up. */
export const SHADOW_USAGE: Record<string, string> = {
  "shadow-xs":
    "Resting controls and Card: Button, Input, Select trigger, Textarea, Checkbox, Radio, Switch, Toggle, Card.",
  "shadow-sm": "Slider thumb, the active Tabs trigger, the floating Sidebar.",
  "shadow-md": "Popover, DropdownMenu, Select content, HoverCard, ContextMenu, Menubar, NavigationMenu.",
  "shadow-lg": "Sheet; nested sub-menus of DropdownMenu, ContextMenu and Menubar.",
  "shadow-xl": "Chart tooltip.",
};

// ── Component cards ──────────────────────────────────────────────────────────────────────────────────────────────────

/** Card groups, keyed by the registry's `meta.category`. */
export const CARD_GROUPS: Record<string, string> = {
  display: "Display",
  feedback: "Feedback",
  form: "Form",
  layout: "Layout",
  navigation: "Navigation",
  overlay: "Overlay",
};

/** Component files that get no card: providers and hooks render nothing of their own. */
export const CARDLESS = new Set(["direction"]);

/** Cards named after a part other than the file's PascalCase name, because no export carries that name. */
export const CARD_NAMES: Record<string, string> = {
  chart: "ChartContainer",
  resizable: "ResizableGroup",
  sonner: "Toaster",
};

/** Registry example files worth showing under the demo, in order of preference; at most two are taken. */
export const EXAMPLE_PRIORITY = [
  "variants",
  "variant",
  "size",
  "sizes",
  "states",
  "status",
  "destructive",
  "outline",
  "secondary",
  "orientation",
  "invalid",
  "disabled",
  "with-icon",
];

/** Components whose demo already fills the card, so no examples are stacked under it. */
export const DEMO_ONLY = new Set(["calendar", "carousel", "chart", "form", "message-scroller", "resizable", "sidebar"]);

/** Starting row heights for cards whose demo is taller than a control; every card grows to fit. */
export const CARD_HEIGHTS: Record<string, number> = {
  attachment: 360,
  bubble: 360,
  calendar: 380,
  card: 420,
  carousel: 320,
  chart: 380,
  command: 380,
  "context-menu": 360,
  field: 520,
  form: 300,
  "input-group": 420,
  item: 360,
  menubar: 380,
  message: 360,
  "message-scroller": 420,
  "navigation-menu": 420,
  resizable: 280,
  sidebar: 560,
  table: 360,
};

/** Summaries that replace a registry description which lists features instead of saying what the component is. */
export const SUMMARY_OVERRIDES: Record<string, string> = {
  button:
    "Triggers an action or, with `asChild`, styles a link as one: six variants and four sizes, with icon and loading states.",
};
