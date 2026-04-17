import { lazy } from "react";
import type { ComponentType, LazyExoticComponent } from "react";

/* -------------------------------------------------------------------------------------------------
 * Types: ComponentRegistry
 * -------------------------------------------------------------------------------------------------*/

export type RegistryType = "registry:ui" | "registry:page" | "registry:block";

interface ComponentConfig {
  name: string;
  component: ComponentType | LazyExoticComponent<ComponentType>;
  className?: string;
  type: RegistryType;
  href: string;
  label?: string;
}

/* -------------------------------------------------------------------------------------------------
 * Helpers: LazyComponent
 * -------------------------------------------------------------------------------------------------*/

type DemoModule<T extends string> = Record<T, ComponentType>;

function createLazyComponent<T extends string>(
  importFn: () => Promise<DemoModule<T>>,
  exportName: T,
): LazyExoticComponent<ComponentType> {
  return lazy(() => importFn().then((m) => ({ default: m[exportName] })));
}

/* -------------------------------------------------------------------------------------------------
 * Registry: UI Components
 * -------------------------------------------------------------------------------------------------*/

const uiComponents = {
  accordion: {
    name: "Accordion",
    component: createLazyComponent(
      () => import("#/components/sink/demos/accordion-demo"),
      "AccordionDemo",
    ),
    href: "/sink/accordion",
  },
  alert: {
    name: "Alert",
    component: createLazyComponent(() => import("#/components/sink/demos/alert-demo"), "AlertDemo"),
    href: "/sink/alert",
  },
  "alert-dialog": {
    name: "Alert Dialog",
    component: createLazyComponent(
      () => import("#/components/sink/demos/alert-dialog-demo"),
      "AlertDialogDemo",
    ),
    href: "/sink/alert-dialog",
  },
  "aspect-ratio": {
    name: "Aspect Ratio",
    component: createLazyComponent(
      () => import("#/components/sink/demos/aspect-ratio-demo"),
      "AspectRatioDemo",
    ),
    href: "/sink/aspect-ratio",
  },
  avatar: {
    name: "Avatar",
    component: createLazyComponent(
      () => import("#/components/sink/demos/avatar-demo"),
      "AvatarDemo",
    ),
    href: "/sink/avatar",
  },
  badge: {
    name: "Badge",
    component: createLazyComponent(() => import("#/components/sink/demos/badge-demo"), "BadgeDemo"),
    href: "/sink/badge",
  },
  breadcrumb: {
    name: "Breadcrumb",
    component: createLazyComponent(
      () => import("#/components/sink/demos/breadcrumb-demo"),
      "BreadcrumbDemo",
    ),
    href: "/sink/breadcrumb",
  },
  button: {
    name: "Button",
    component: createLazyComponent(
      () => import("#/components/sink/demos/button-demo"),
      "ButtonDemo",
    ),
    href: "/sink/button",
  },
  "button-group": {
    name: "Button Group",
    component: createLazyComponent(
      () => import("#/components/sink/demos/button-group-demo"),
      "ButtonGroupDemo",
    ),
    href: "/sink/button-group",
    label: "New",
  },
  calendar: {
    name: "Calendar",
    component: createLazyComponent(
      () => import("#/components/sink/demos/calendar-demo"),
      "CalendarDemo",
    ),
    href: "/sink/calendar",
  },
  card: {
    name: "Card",
    component: createLazyComponent(() => import("#/components/sink/demos/card-demo"), "CardDemo"),
    href: "/sink/card",
  },
  carousel: {
    name: "Carousel",
    component: createLazyComponent(
      () => import("#/components/sink/demos/carousel-demo"),
      "CarouselDemo",
    ),
    href: "/sink/carousel",
  },
  chart: {
    name: "Chart",
    component: createLazyComponent(() => import("#/components/sink/demos/chart-demo"), "ChartDemo"),
    className: "w-full",
    href: "/sink/chart",
  },
  checkbox: {
    name: "Checkbox",
    component: createLazyComponent(
      () => import("#/components/sink/demos/checkbox-demo"),
      "CheckboxDemo",
    ),
    href: "/sink/checkbox",
  },
  collapsible: {
    name: "Collapsible",
    component: createLazyComponent(
      () => import("#/components/sink/demos/collapsible-demo"),
      "CollapsibleDemo",
    ),
    href: "/sink/collapsible",
  },
  combobox: {
    name: "Combobox",
    component: createLazyComponent(
      () => import("#/components/sink/demos/combobox-demo"),
      "ComboboxDemo",
    ),
    href: "/sink/combobox",
  },
  command: {
    name: "Command",
    component: createLazyComponent(
      () => import("#/components/sink/demos/command-demo"),
      "CommandDemo",
    ),
    href: "/sink/command",
  },
  "context-menu": {
    name: "Context Menu",
    component: createLazyComponent(
      () => import("#/components/sink/demos/context-menu-demo"),
      "ContextMenuDemo",
    ),
    href: "/sink/context-menu",
  },
  "date-picker": {
    name: "Date Picker",
    component: createLazyComponent(
      () => import("#/components/sink/demos/date-picker-demo"),
      "DatePickerDemo",
    ),
    href: "/sink/date-picker",
  },
  dialog: {
    name: "Dialog",
    component: createLazyComponent(
      () => import("#/components/sink/demos/dialog-demo"),
      "DialogDemo",
    ),
    href: "/sink/dialog",
  },
  drawer: {
    name: "Drawer",
    component: createLazyComponent(
      () => import("#/components/sink/demos/drawer-demo"),
      "DrawerDemo",
    ),
    href: "/sink/drawer",
  },
  "dropdown-menu": {
    name: "Dropdown Menu",
    component: createLazyComponent(
      () => import("#/components/sink/demos/dropdown-menu-demo"),
      "DropdownMenuDemo",
    ),
    href: "/sink/dropdown-menu",
  },
  empty: {
    name: "Empty",
    component: createLazyComponent(() => import("#/components/sink/demos/empty-demo"), "EmptyDemo"),
    href: "/sink/empty",
    label: "New",
  },
  field: {
    name: "Field",
    component: createLazyComponent(() => import("#/components/sink/demos/field-demo"), "FieldDemo"),
    href: "/sink/field",
    label: "New",
  },
  form: {
    name: "Form",
    component: createLazyComponent(() => import("#/components/sink/demos/form-demo"), "FormDemo"),
    href: "/sink/form",
  },
  "hover-card": {
    name: "Hover Card",
    component: createLazyComponent(
      () => import("#/components/sink/demos/hover-card-demo"),
      "HoverCardDemo",
    ),
    href: "/sink/hover-card",
  },
  input: {
    name: "Input",
    component: createLazyComponent(() => import("#/components/sink/demos/input-demo"), "InputDemo"),
    href: "/sink/input",
  },
  "input-group": {
    name: "Input Group",
    component: createLazyComponent(
      () => import("#/components/sink/demos/input-group-demo"),
      "InputGroupDemo",
    ),
    href: "/sink/input-group",
    label: "New",
  },
  "input-otp": {
    name: "Input OTP",
    component: createLazyComponent(
      () => import("#/components/sink/demos/input-otp-demo"),
      "InputOTPDemo",
    ),
    href: "/sink/input-otp",
  },
  item: {
    name: "Item",
    component: createLazyComponent(() => import("#/components/sink/demos/item-demo"), "ItemDemo"),
    href: "/sink/item",
    label: "New",
  },
  kbd: {
    name: "Kbd",
    component: createLazyComponent(() => import("#/components/sink/demos/kbd-demo"), "KbdDemo"),
    href: "/sink/kbd",
    label: "New",
  },
  label: {
    name: "Label",
    component: createLazyComponent(() => import("#/components/sink/demos/label-demo"), "LabelDemo"),
    href: "/sink/label",
  },
  menubar: {
    name: "Menubar",
    component: createLazyComponent(
      () => import("#/components/sink/demos/menubar-demo"),
      "MenubarDemo",
    ),
    href: "/sink/menubar",
  },
  "navigation-menu": {
    name: "Navigation Menu",
    component: createLazyComponent(
      () => import("#/components/sink/demos/navigation-menu-demo"),
      "NavigationMenuDemo",
    ),
    href: "/sink/navigation-menu",
  },
  "native-select": {
    name: "Native Select",
    component: createLazyComponent(
      () => import("#/components/sink/demos/native-select-demo"),
      "NativeSelectDemo",
    ),
    href: "/sink/native-select",
    label: "New",
  },
  pagination: {
    name: "Pagination",
    component: createLazyComponent(
      () => import("#/components/sink/demos/pagination-demo"),
      "PaginationDemo",
    ),
    href: "/sink/pagination",
  },
  popover: {
    name: "Popover",
    component: createLazyComponent(
      () => import("#/components/sink/demos/popover-demo"),
      "PopoverDemo",
    ),
    href: "/sink/popover",
  },
  progress: {
    name: "Progress",
    component: createLazyComponent(
      () => import("#/components/sink/demos/progress-demo"),
      "ProgressDemo",
    ),
    href: "/sink/progress",
  },
  "radio-group": {
    name: "Radio Group",
    component: createLazyComponent(
      () => import("#/components/sink/demos/radio-group-demo"),
      "RadioGroupDemo",
    ),
    href: "/sink/radio-group",
  },
  resizable: {
    name: "Resizable",
    component: createLazyComponent(
      () => import("#/components/sink/demos/resizable-demo"),
      "ResizableDemo",
    ),
    href: "/sink/resizable",
  },
  "scroll-area": {
    name: "Scroll Area",
    component: createLazyComponent(
      () => import("#/components/sink/demos/scroll-area-demo"),
      "ScrollAreaDemo",
    ),
    href: "/sink/scroll-area",
  },
  select: {
    name: "Select",
    component: createLazyComponent(
      () => import("#/components/sink/demos/select-demo"),
      "SelectDemo",
    ),
    href: "/sink/select",
  },
  separator: {
    name: "Separator",
    component: createLazyComponent(
      () => import("#/components/sink/demos/separator-demo"),
      "SeparatorDemo",
    ),
    href: "/sink/separator",
  },
  sheet: {
    name: "Sheet",
    component: createLazyComponent(() => import("#/components/sink/demos/sheet-demo"), "SheetDemo"),
    href: "/sink/sheet",
  },
  skeleton: {
    name: "Skeleton",
    component: createLazyComponent(
      () => import("#/components/sink/demos/skeleton-demo"),
      "SkeletonDemo",
    ),
    href: "/sink/skeleton",
  },
  slider: {
    name: "Slider",
    component: createLazyComponent(
      () => import("#/components/sink/demos/slider-demo"),
      "SliderDemo",
    ),
    href: "/sink/slider",
  },
  sonner: {
    name: "Sonner",
    component: createLazyComponent(
      () => import("#/components/sink/demos/sonner-demo"),
      "SonnerDemo",
    ),
    href: "/sink/sonner",
  },
  spinner: {
    name: "Spinner",
    component: createLazyComponent(
      () => import("#/components/sink/demos/spinner-demo"),
      "SpinnerDemo",
    ),
    href: "/sink/spinner",
    label: "New",
  },
  switch: {
    name: "Switch",
    component: createLazyComponent(
      () => import("#/components/sink/demos/switch-demo"),
      "SwitchDemo",
    ),
    href: "/sink/switch",
  },
  table: {
    name: "Table",
    component: createLazyComponent(() => import("#/components/sink/demos/table-demo"), "TableDemo"),
    href: "/sink/table",
  },
  tabs: {
    name: "Tabs",
    component: createLazyComponent(() => import("#/components/sink/demos/tabs-demo"), "TabsDemo"),
    href: "/sink/tabs",
  },
  textarea: {
    name: "Textarea",
    component: createLazyComponent(
      () => import("#/components/sink/demos/textarea-demo"),
      "TextareaDemo",
    ),
    href: "/sink/textarea",
  },
  toggle: {
    name: "Toggle",
    component: createLazyComponent(
      () => import("#/components/sink/demos/toggle-demo"),
      "ToggleDemo",
    ),
    href: "/sink/toggle",
  },
  "toggle-group": {
    name: "Toggle Group",
    component: createLazyComponent(
      () => import("#/components/sink/demos/toggle-group-demo"),
      "ToggleGroupDemo",
    ),
    href: "/sink/toggle-group",
  },
  tooltip: {
    name: "Tooltip",
    component: createLazyComponent(
      () => import("#/components/sink/demos/tooltip-demo"),
      "TooltipDemo",
    ),
    href: "/sink/tooltip",
  },
} as const satisfies Record<string, Omit<ComponentConfig, "type">>;

/* -------------------------------------------------------------------------------------------------
 * Registry: Page Components
 * -------------------------------------------------------------------------------------------------*/

const EmptyComponent: ComponentType = () => null;

const pageComponents = {
  blocks: {
    name: "Forms",
    component: EmptyComponent,
    href: "/sink/forms",
  },
  "start-form": {
    name: "TanStack Start Form",
    component: EmptyComponent,
    href: "/sink/start-form",
  },
  "tanstack-form": {
    name: "Tanstack Form",
    component: EmptyComponent,
    href: "/sink/tanstack-form",
  },
  "react-hook-form": {
    name: "React Hook Form",
    component: EmptyComponent,
    href: "/sink/react-hook-form",
  },
} as const satisfies Record<string, Omit<ComponentConfig, "type">>;

/* -------------------------------------------------------------------------------------------------
 * Helpers: Build Registry
 * -------------------------------------------------------------------------------------------------*/

function buildRegistry<T extends Record<string, Omit<ComponentConfig, "type">>>(
  components: T,
  type: RegistryType,
): Record<keyof T, ComponentConfig> {
  return Object.fromEntries(
    Object.entries(components).map(([key, config]) => [key, { ...config, type }]),
  ) as Record<keyof T, ComponentConfig>;
}

/* -------------------------------------------------------------------------------------------------
 * Constants: Registry Types
 * -------------------------------------------------------------------------------------------------*/

export const REGISTRY_TYPES = ["registry:ui", "registry:page", "registry:block"] as const;

export const REGISTRY_TYPE_LABELS: Record<RegistryType, string> = {
  "registry:ui": "Components",
  "registry:page": "Pages",
  "registry:block": "Blocks",
};

/* -------------------------------------------------------------------------------------------------
 * Export: Component Registry
 * -------------------------------------------------------------------------------------------------*/

export const componentRegistry: Record<string, ComponentConfig> = {
  ...buildRegistry(uiComponents, "registry:ui"),
  ...buildRegistry(pageComponents, "registry:page"),
};

/* -------------------------------------------------------------------------------------------------
 * Export: Components By Type (Pre-grouped for performance)
 * -------------------------------------------------------------------------------------------------*/

export const componentsByType: Record<RegistryType, [string, ComponentConfig][]> = {
  "registry:ui": Object.entries(buildRegistry(uiComponents, "registry:ui")),
  "registry:page": Object.entries(buildRegistry(pageComponents, "registry:page")),
  "registry:block": [],
};
