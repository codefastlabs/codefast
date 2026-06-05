/**
 * Single source of truth for the component registry (lightweight metadata only).
 *
 * The home hero, the /components showcase, the header ⌘K palette, and any future
 * per-component detail page all derive from here. Heavy demo components and their
 * raw source strings live separately in `src/components/examples/demos.tsx` so
 * that importing this metadata never pulls the whole demo bundle into a route.
 *
 * The import path for every component is `@codefast/ui/<slug>` — derive it with
 * `componentPath(slug)` rather than repeating the prefix per entry.
 */

/* -------------------------------------------------------------------------- */
/* Categories                                                                  */
/* -------------------------------------------------------------------------- */

export const CATEGORIES = [
  {
    id: "display",
    label: "Display",
    description:
      "Presentational atoms for surfacing information, status, and identity. No interactivity required.",
  },
  {
    id: "form",
    label: "Form",
    description:
      "Input primitives and controls for collecting user data. All keyboard-accessible and screen-reader ready.",
  },
  {
    id: "navigation",
    label: "Navigation",
    description:
      "Components for moving between views, routes, and pages. Built for keyboard and screen-reader users.",
  },
  {
    id: "overlay",
    label: "Overlay",
    description:
      "Floating UI: modals, popovers, menus, and tooltips. All trap focus and close on Escape.",
  },
  {
    id: "feedback",
    label: "Feedback",
    description:
      "Status indicators, confirmations, and loading states that communicate async operations to users.",
  },
  {
    id: "layout",
    label: "Layout",
    description:
      "Structural components for organising and containing content. Compose freely with any child.",
  },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

/* -------------------------------------------------------------------------- */
/* Components                                                                  */
/* -------------------------------------------------------------------------- */

/** Lifecycle maturity, surfaced as a badge on the detail page. */
export type ComponentStatus = "stable" | "beta" | "deprecated";

export interface ComponentMeta {
  /** Display name, e.g. "Alert Dialog". */
  readonly name: string;
  /** URL/anchor/import slug, e.g. "alert-dialog". `@codefast/ui/<slug>`. */
  readonly slug: string;
  readonly category: CategoryId;
  readonly description: string;
  /** Render the showcase card across two grid columns. */
  readonly wide?: boolean;
  /**
   * Whether the component ships a live card demo on /components.
   * Sidebar is a real export but too large for a card, so it has no demo.
   */
  readonly hasDemo: boolean;
  /** Lifecycle maturity. Absent means `stable`; a badge shows only when not stable. */
  readonly status?: ComponentStatus;
}

/**
 * Ordered by category, then by the curated order shown on /components.
 * The grid renders entries in this exact order.
 */
export const ALL_COMPONENTS: ReadonlyArray<ComponentMeta> = [
  // — Display —
  {
    name: "Badge",
    slug: "badge",
    category: "display",
    description:
      "Compact label for status, category, or count. Four variants cover most use cases.",
    hasDemo: true,
  },
  {
    name: "Alert",
    slug: "alert",
    category: "display",
    description:
      "Contextual banner with icon, title, and body. Supports default and destructive variants.",
    wide: true,
    hasDemo: true,
  },
  {
    name: "Avatar",
    slug: "avatar",
    category: "display",
    description:
      "User icon with image support and initials fallback. Compose with AvatarGroup for stacks.",
    hasDemo: true,
  },
  {
    name: "Spinner",
    slug: "spinner",
    category: "display",
    description: "Indeterminate loading indicator. Wrap children — shown when loading is false.",
    hasDemo: true,
  },
  {
    name: "Kbd",
    slug: "kbd",
    category: "display",
    description: "Keyboard shortcut display. Use KbdGroup to compose multi-key combos.",
    hasDemo: true,
  },
  {
    name: "Aspect Ratio",
    slug: "aspect-ratio",
    category: "display",
    description:
      "Locks content to a specific width-to-height ratio. Useful for images, videos, and embeds.",
    hasDemo: true,
  },
  {
    name: "Carousel",
    slug: "carousel",
    category: "display",
    description:
      "Embla-powered slide carousel with prev/next controls. Supports horizontal and vertical axes.",
    hasDemo: true,
  },
  {
    name: "Chart",
    slug: "chart",
    category: "display",
    description:
      "Recharts wrapper with consistent theming, tooltip, and legend. Supports all chart types.",
    wide: true,
    hasDemo: true,
  },
  {
    name: "Empty",
    slug: "empty",
    category: "display",
    description: "Empty-state layout with media, title, description, and action slots.",
    hasDemo: true,
  },
  {
    name: "Item",
    slug: "item",
    category: "display",
    description:
      "Row layout for lists. Composes media, content, title, description, and action slots.",
    wide: true,
    hasDemo: true,
  },
  {
    name: "Table",
    slug: "table",
    category: "display",
    description: "Semantic HTML table with styled header, body, footer, and caption slots.",
    wide: true,
    hasDemo: true,
  },

  // — Form —
  {
    name: "Button",
    slug: "button",
    category: "form",
    description:
      "Six variants and four sizes. Supports icons, loading state, and asChild composition.",
    wide: true,
    hasDemo: true,
  },
  {
    name: "Button Group",
    slug: "button-group",
    category: "form",
    description:
      "Horizontal or vertical group that visually joins adjacent buttons into a single control.",
    hasDemo: true,
  },
  {
    name: "Input",
    slug: "input",
    category: "form",
    description: "Text input with focus ring, disabled state, and file input styling.",
    hasDemo: true,
  },
  {
    name: "Input Group",
    slug: "input-group",
    category: "form",
    description: "Composes an input with leading/trailing addons, text labels, and icon buttons.",
    wide: true,
    hasDemo: true,
  },
  {
    name: "Input Number",
    slug: "input-number",
    category: "form",
    description:
      "Numeric input with increment/decrement controls, min/max/step, and format options.",
    hasDemo: true,
  },
  {
    name: "Input OTP",
    slug: "input-otp",
    category: "form",
    description: "One-time password input with slot groups and separator. Built on input-otp.",
    hasDemo: true,
  },
  {
    name: "Input Password",
    slug: "input-password",
    category: "form",
    description:
      "Password field with a show/hide toggle. Extends Input Group with no extra markup.",
    hasDemo: true,
  },
  {
    name: "Input Search",
    slug: "input-search",
    category: "form",
    description:
      "Search field with a leading icon and a one-click clear button. Controlled or uncontrolled.",
    hasDemo: true,
  },
  {
    name: "Textarea",
    slug: "textarea",
    category: "form",
    description: "Multiline text input. Pair with Label and field utilities for accessible forms.",
    hasDemo: true,
  },
  {
    name: "Select",
    slug: "select",
    category: "form",
    description:
      "Accessible dropdown selector. Supports groups, disabled options, and custom triggers.",
    hasDemo: true,
  },
  {
    name: "Native Select",
    slug: "native-select",
    category: "form",
    description: "Styled HTML select element with option groups. Zero JS — best for mobile forms.",
    hasDemo: true,
  },
  {
    name: "Checkbox",
    slug: "checkbox",
    category: "form",
    description:
      "Binary control with indeterminate state. Controlled or uncontrolled via onCheckedChange.",
    hasDemo: true,
  },
  {
    name: "Checkbox Group",
    slug: "checkbox-group",
    category: "form",
    description: "Multi-select group of checkboxes sharing a value array. Supports disabled items.",
    hasDemo: true,
  },
  {
    name: "Checkbox Cards",
    slug: "checkbox-cards",
    category: "form",
    description:
      "Card-style multi-select. Each card has a built-in checkbox with highlighted selected state.",
    hasDemo: true,
  },
  {
    name: "Radio",
    slug: "radio",
    category: "form",
    description:
      "Single native radio input. Use Radio Group for accessible keyboard-navigable groups.",
    hasDemo: true,
  },
  {
    name: "Radio Group",
    slug: "radio-group",
    category: "form",
    description: "Single-selection group. Use value + onValueChange for controlled behaviour.",
    hasDemo: true,
  },
  {
    name: "Radio Cards",
    slug: "radio-cards",
    category: "form",
    description:
      "Card-style single-select. Each card highlights when selected, ideal for plan pickers.",
    hasDemo: true,
  },
  {
    name: "Switch",
    slug: "switch",
    category: "form",
    description:
      "Toggle control for boolean settings. Fires onCheckedChange with the new boolean value.",
    hasDemo: true,
  },
  {
    name: "Slider",
    slug: "slider",
    category: "form",
    description: "Range input with keyboard support. Supports min, max, step, and multiple thumbs.",
    hasDemo: true,
  },
  {
    name: "Toggle",
    slug: "toggle",
    category: "form",
    description:
      "Pressable button with active/inactive state. Use ToggleGroup for exclusive selection.",
    hasDemo: true,
  },
  {
    name: "Toggle Group",
    slug: "toggle-group",
    category: "form",
    description:
      "Single or multiple selection group of toggle buttons. Ideal for toolbars and alignment pickers.",
    hasDemo: true,
  },
  {
    name: "Calendar",
    slug: "calendar",
    category: "form",
    description:
      "Full calendar built on @daypicker/react. Supports single, multiple, and range selection.",
    hasDemo: true,
  },
  {
    name: "Label",
    slug: "label",
    category: "form",
    description: "Accessible form label that forwards htmlFor. Pairs with any form control.",
    hasDemo: true,
  },
  {
    name: "Field",
    slug: "field",
    category: "form",
    description:
      "Layout wrapper that composes label, description, error, and control in vertical or horizontal orientation.",
    wide: true,
    hasDemo: true,
  },
  {
    name: "Form",
    slug: "form",
    category: "form",
    description:
      "React Hook Form integration with accessible label, description, and error message binding.",
    hasDemo: true,
  },

  // — Navigation —
  {
    name: "Tabs",
    slug: "tabs",
    category: "navigation",
    description: "Accessible tabbed interface. Automatic or manual activation via activationMode.",
    wide: true,
    hasDemo: true,
  },
  {
    name: "Breadcrumb",
    slug: "breadcrumb",
    category: "navigation",
    description:
      "Hierarchical location trail. Supports custom separators, ellipsis, and asChild links.",
    hasDemo: true,
  },
  {
    name: "Pagination",
    slug: "pagination",
    category: "navigation",
    description:
      "Page navigation with prev/next, ellipsis, and active page. Compose with your router.",
    hasDemo: true,
  },
  {
    name: "Menubar",
    slug: "menubar",
    category: "navigation",
    description:
      "Horizontal menu bar with dropdowns, checkboxes, radio items, and keyboard navigation.",
    wide: true,
    hasDemo: true,
  },
  {
    name: "Navigation Menu",
    slug: "navigation-menu",
    category: "navigation",
    description: "Animated mega-menu with animated content panels. Built on Radix NavigationMenu.",
    wide: true,
    hasDemo: true,
  },
  {
    name: "Sidebar",
    slug: "sidebar",
    category: "navigation",
    description:
      "Composable application sidebar with collapsible groups, rail, and mobile sheet. Built for app shells.",
    hasDemo: false,
  },

  // — Overlay —
  {
    name: "Dialog",
    slug: "dialog",
    category: "overlay",
    description:
      "Modal window with focus trap, backdrop blur, and accessible close. Use AlertDialog for destructive confirms.",
    hasDemo: true,
  },
  {
    name: "Tooltip",
    slug: "tooltip",
    category: "overlay",
    description:
      "Hover label with delay and side placement control. Supports rich content including Kbd.",
    hasDemo: true,
  },
  {
    name: "Popover",
    slug: "popover",
    category: "overlay",
    description:
      "Non-modal floating panel anchored to a trigger. Use for settings panels and pickers.",
    hasDemo: true,
  },
  {
    name: "Dropdown Menu",
    slug: "dropdown-menu",
    category: "overlay",
    description:
      "Contextual action menu with keyboard navigation, shortcuts, checkboxes, and radio groups.",
    hasDemo: true,
  },
  {
    name: "Alert Dialog",
    slug: "alert-dialog",
    category: "overlay",
    description:
      "Blocking confirmation modal requiring an explicit decision. Backs the browser back button.",
    hasDemo: true,
  },
  {
    name: "Command",
    slug: "command",
    category: "overlay",
    description: "Command palette with fuzzy search, groups, keyboard shortcuts, and empty state.",
    hasDemo: true,
  },
  {
    name: "Context Menu",
    slug: "context-menu",
    category: "overlay",
    description: "Right-click menu with items, checkboxes, radio groups, submenus, and shortcuts.",
    hasDemo: true,
  },
  {
    name: "Drawer",
    slug: "drawer",
    category: "overlay",
    description:
      "Bottom sheet drawer built on Vaul. Supports drag-to-dismiss and scale background.",
    hasDemo: true,
  },
  {
    name: "Hover Card",
    slug: "hover-card",
    category: "overlay",
    description:
      "Rich preview card that appears on hover. Ideal for user profiles and link previews.",
    hasDemo: true,
  },
  {
    name: "Sheet",
    slug: "sheet",
    category: "overlay",
    description:
      "Side-anchored panel (left, right, top, or bottom). Useful for settings and detail drawers.",
    hasDemo: true,
  },

  // — Feedback —
  {
    name: "Progress",
    slug: "progress",
    category: "feedback",
    description:
      "Determinate progress bar. Pass value 0–100. Colour via className on the indicator slot.",
    hasDemo: true,
  },
  {
    name: "Progress Circle",
    slug: "progress-circle",
    category: "feedback",
    description:
      "Circular progress indicator with optional value label and animation. Multiple sizes.",
    hasDemo: true,
  },
  {
    name: "Skeleton",
    slug: "skeleton",
    category: "feedback",
    description: "Shimmer placeholder for any shape of content — cards, text lines, avatars.",
    wide: true,
    hasDemo: true,
  },
  {
    name: "Sonner",
    slug: "sonner",
    category: "feedback",
    description:
      "Toast notifications via Sonner. Supports success, error, warning, and custom durations.",
    wide: true,
    hasDemo: true,
  },

  // — Layout —
  {
    name: "Card",
    slug: "card",
    category: "layout",
    description:
      "Elevated surface for grouping related content. Compose Header, Content, and Footer slots freely.",
    hasDemo: true,
  },
  {
    name: "Accordion",
    slug: "accordion",
    category: "layout",
    description:
      "Expandable sections with smooth animation. Supports single or multiple open items.",
    wide: true,
    hasDemo: true,
  },
  {
    name: "Separator",
    slug: "separator",
    category: "layout",
    description: "Semantic horizontal or vertical divider. Renders as hr with role=separator.",
    hasDemo: true,
  },
  {
    name: "Scroll Area",
    slug: "scroll-area",
    category: "layout",
    description:
      "Custom-styled scrollbar that matches your design system. Hides native OS scrollbars.",
    hasDemo: true,
  },
  {
    name: "Collapsible",
    slug: "collapsible",
    category: "layout",
    description:
      "Togglable content section with animated expand/collapse. Controlled or uncontrolled.",
    hasDemo: true,
  },
  {
    name: "Resizable",
    slug: "resizable",
    category: "layout",
    description: "Drag-to-resize panel groups. Supports horizontal, vertical, and nested layouts.",
    wide: true,
    hasDemo: true,
  },
];

export type ComponentEntry = (typeof ALL_COMPONENTS)[number];

/** Components that ship a live card demo on /components (everything except Sidebar). */
export const DEMO_COMPONENTS = ALL_COMPONENTS.filter((component) => component.hasDemo);

/** `@codefast/ui/<slug>` import path for a component. */
export function componentPath(slug: string): string {
  return `@codefast/ui/${slug}`;
}
