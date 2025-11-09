import dynamic from "next/dynamic";

import type { RegistryGroup, RegistryItem } from "@/types/registry";

export const registryComponents: Record<string, RegistryItem> = {
  accordion: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/accordion-demo").then(
        (module_) => module_.AccordionDemo,
      ),
    ),
    description: "Accordion",
    slug: "accordion",
    title: "Accordion",
  },
  alert: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/alert-demo").then((module_) => module_.AlertDemo),
    ),
    description: "Alert",
    slug: "alert",
    title: "Alert",
  },
  "alert-dialog": {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/alert-dialog-demo").then(
        (module_) => module_.AlertDialogDemo,
      ),
    ),
    description: "Alert Dialog",
    slug: "alert-dialog",
    title: "Alert Dialog",
  },
  "aspect-ratio": {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/aspect-ratio-demo").then(
        (module_) => module_.AspectRatioDemo,
      ),
    ),
    description: "Aspect Ratio",
    slug: "aspect-ratio",
    title: "Aspect Ratio",
  },
  avatar: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/avatar-demo").then(
        (module_) => module_.AvatarDemo,
      ),
    ),
    description: "Avatar",
    slug: "avatar",
    title: "Avatar",
  },
  badge: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/badge-demo").then((module_) => module_.BadgeDemo),
    ),
    description: "Badge",
    slug: "badge",
    title: "Badge",
  },
  breadcrumb: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/breadcrumb-demo").then(
        (module_) => module_.BreadcrumbDemo,
      ),
    ),
    description: "Breadcrumb",
    slug: "breadcrumb",
    title: "Breadcrumb",
  },
  button: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/button-demo").then(
        (module_) => module_.ButtonDemo,
      ),
    ),
    description: "Button",
    slug: "button",
    title: "Button",
  },
  calendar: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/calendar-demo").then(
        (module_) => module_.CalendarDemo,
      ),
    ),
    description: "Calendar",
    slug: "calendar",
    title: "Calendar",
  },
  card: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/card-demo").then((module_) => module_.CardDemo),
    ),
    description: "Card",
    slug: "card",
    title: "Card",
  },
  carousel: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/carousel-demo").then(
        (module_) => module_.CarouselDemo,
      ),
    ),
    description: "Carousel",
    slug: "carousel",
    title: "Carousel",
  },
  chart: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/chart-demo").then((module_) => module_.ChartDemo),
    ),
    description: "Chart",
    slug: "chart",
    title: "Chart",
  },
  checkbox: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/checkbox-demo").then(
        (module_) => module_.CheckboxDemo,
      ),
    ),
    description: "Checkbox",
    slug: "checkbox",
    title: "Checkbox",
  },
  "checkbox-cards": {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/checkbox-cards-demo").then(
        (module_) => module_.CheckboxCardsDemo,
      ),
    ),
    description: "Checkbox Cards",
    slug: "checkbox-cards",
    title: "Checkbox Cards",
  },
  "checkbox-group": {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/checkbox-group-demo").then(
        (module_) => module_.CheckboxGroupDemo,
      ),
    ),
    description: "Checkbox Group",
    slug: "checkbox-group",
    title: "Checkbox Group",
  },
  collapsible: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/collapsible-demo").then(
        (module_) => module_.CollapsibleDemo,
      ),
    ),
    description: "Collapsible",
    slug: "collapsible",
    title: "Collapsible",
  },
  combobox: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/combobox-demo").then(
        (module_) => module_.ComboboxDemo,
      ),
    ),
    description: "Combobox",
    slug: "combobox",
    title: "Combobox",
  },
  command: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/command-demo").then(
        (module_) => module_.CommandDemo,
      ),
    ),
    description: "Command",
    slug: "command",
    title: "Command",
  },
  "context-menu": {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/context-menu-demo").then(
        (module_) => module_.ContextMenuDemo,
      ),
    ),
    description: "Context Menu",
    slug: "context-menu",
    title: "Context Menu",
  },
  "date-picker": {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/date-picker-demo").then(
        (module_) => module_.DatePickerDemo,
      ),
    ),
    description: "Date Picker",
    slug: "date-picker",
    title: "Date Picker",
  },
  dialog: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/dialog-demo").then(
        (module_) => module_.DialogDemo,
      ),
    ),
    description: "Dialog",
    slug: "dialog",
    title: "Dialog",
  },
  drawer: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/drawer-demo").then(
        (module_) => module_.DrawerDemo,
      ),
    ),
    description: "Drawer",
    slug: "drawer",
    title: "Drawer",
  },
  "dropdown-menu": {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/dropdown-menu-demo").then(
        (module_) => module_.DropdownMenuDemo,
      ),
    ),
    description: "Dropdown Menu",
    slug: "dropdown-menu",
    title: "Dropdown Menu",
  },
  empty: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/empty-demo").then((module_) => module_.EmptyDemo),
    ),
    description: "Empty",
    slug: "empty",
    title: "Empty",
  },
  form: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/form-demo").then((module_) => module_.FormDemo),
    ),
    description: "Form",
    slug: "form",
    title: "Form",
  },
  "hover-card": {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/hover-card-demo").then(
        (module_) => module_.HoverCardDemo,
      ),
    ),
    description: "Hover Card",
    slug: "hover-card",
    title: "Hover Card",
  },
  input: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/input-demo").then((module_) => module_.InputDemo),
    ),
    description: "Input",
    slug: "input",
    title: "Input",
  },
  "input-date": {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/input-date-demo").then(
        (module_) => module_.InputDateDemo,
      ),
    ),
    description: "Input Date",
    slug: "input-date",
    title: "Input Date",
  },
  "input-number": {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/input-number-demo").then(
        (module_) => module_.InputNumberDemo,
      ),
    ),
    description: "Input Number",
    slug: "input-number",
    title: "Input Number",
  },
  "input-otp": {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/input-otp-demo").then(
        (module_) => module_.InputOTPDemo,
      ),
    ),
    description: "Input OTP",
    slug: "input-otp",
    title: "Input OTP",
  },
  "input-password": {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/input-password-demo").then(
        (module_) => module_.InputPasswordDemo,
      ),
    ),
    description: "Input Password",
    slug: "input-password",
    title: "Input Password",
  },
  "input-search": {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/input-search-demo").then(
        (module_) => module_.InputSearchDemo,
      ),
    ),
    description: "Input Search",
    slug: "input-search",
    title: "Input Search",
  },
  "input-time": {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/input-time-demo").then(
        (module_) => module_.InputTimeDemo,
      ),
    ),
    description: "Input Time",
    slug: "input-time",
    title: "Input Time",
  },
  kbd: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/kbd-demo").then((module_) => module_.KbdDemo),
    ),
    description: "Kbd",
    slug: "kbd",
    title: "Kbd",
  },
  label: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/label-demo").then((module_) => module_.LabelDemo),
    ),
    description: "Label",
    slug: "label",
    title: "Label",
  },
  menubar: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/menubar-demo").then(
        (module_) => module_.MenubarDemo,
      ),
    ),
    description: "Menubar",
    slug: "menubar",
    title: "Menubar",
  },
  "navigation-menu": {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/navigation-menu-demo").then(
        (module_) => module_.NavigationMenuDemo,
      ),
    ),
    description: "Navigation Menu",
    slug: "navigation-menu",
    title: "Navigation Menu",
  },
  pagination: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/pagination-demo").then(
        (module_) => module_.PaginationDemo,
      ),
    ),
    description: "Pagination",
    slug: "pagination",
    title: "Pagination",
  },
  popover: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/popover-demo").then(
        (module_) => module_.PopoverDemo,
      ),
    ),
    description: "Popover",
    slug: "popover",
    title: "Popover",
  },
  progress: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/progress-demo").then(
        (module_) => module_.ProgressDemo,
      ),
    ),
    description: "Progress",
    slug: "progress",
    title: "Progress",
  },
  "progress-circle": {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/progress-circle-demo").then(
        (module_) => module_.ProgressCircleDemo,
      ),
    ),
    description: "Progress Circle",
    slug: "progress-circle",
    title: "Progress Circle",
  },
  radio: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/radio-demo").then((module_) => module_.RadioDemo),
    ),
    description: "Radio",
    slug: "radio",
    title: "Radio",
  },
  "radio-cards": {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/radio-cards-demo").then(
        (module_) => module_.RadioCardsDemo,
      ),
    ),
    description: "Radio Cards",
    slug: "radio-cards",
    title: "Radio Cards",
  },
  "radio-group": {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/radio-group-demo").then(
        (module_) => module_.RadioGroupDemo,
      ),
    ),
    description: "Radio Group",
    slug: "radio-group",
    title: "Radio Group",
  },
  resizable: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/resizable-demo").then(
        (module_) => module_.ResizableDemo,
      ),
    ),
    description: "Resizable",
    slug: "resizable",
    title: "Resizable",
  },
  "scroll-area": {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/scroll-area-demo").then(
        (module_) => module_.ScrollAreaDemo,
      ),
    ),
    description: "Scroll Area",
    slug: "scroll-area",
    title: "Scroll Area",
  },
  select: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/select-demo").then(
        (module_) => module_.SelectDemo,
      ),
    ),
    description: "Select",
    slug: "select",
    title: "Select",
  },
  separator: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/separator-demo").then(
        (module_) => module_.SeparatorDemo,
      ),
    ),
    description: "Separator",
    slug: "separator",
    title: "Separator",
  },
  sheet: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/sheet-demo").then((module_) => module_.SheetDemo),
    ),
    description: "Sheet",
    slug: "sheet",
    title: "Sheet",
  },
  skeleton: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/skeleton-demo").then(
        (module_) => module_.SkeletonDemo,
      ),
    ),
    description: "Skeleton",
    slug: "skeleton",
    title: "Skeleton",
  },
  slider: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/slider-demo").then(
        (module_) => module_.SliderDemo,
      ),
    ),
    description: "Slider",
    slug: "slider",
    title: "Slider",
  },
  sonner: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/sonner-demo").then(
        (module_) => module_.SonnerDemo,
      ),
    ),
    description: "Sonner",
    slug: "sonner",
    title: "Sonner",
  },
  switch: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/switch-demo").then(
        (module_) => module_.SwitchDemo,
      ),
    ),
    description: "Switch",
    slug: "switch",
    title: "Switch",
  },
  table: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/table-demo").then((module_) => module_.TableDemo),
    ),
    description: "Table",
    slug: "table",
    title: "Table",
  },
  tabs: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/tabs-demo").then((module_) => module_.TabsDemo),
    ),
    description: "Tabs",
    slug: "tabs",
    title: "Tabs",
  },
  textarea: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/textarea-demo").then(
        (module_) => module_.TextareaDemo,
      ),
    ),
    description: "Textarea",
    slug: "textarea",
    title: "Textarea",
  },
  toggle: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/toggle-demo").then(
        (module_) => module_.ToggleDemo,
      ),
    ),
    description: "Toggle",
    slug: "toggle",
    title: "Toggle",
  },
  "toggle-group": {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/toggle-group-demo").then(
        (module_) => module_.ToggleGroupDemo,
      ),
    ),
    description: "Toggle Group",
    slug: "toggle-group",
    title: "Toggle Group",
  },
  tooltip: {
    component: dynamic(async () =>
      import("@/app/(app)/components/_components/tooltip-demo").then(
        (module_) => module_.TooltipDemo,
      ),
    ),
    description: "Tooltip",
    slug: "tooltip",
    title: "Tooltip",
  },
};

export const registryComponentGroups: RegistryGroup[] = [
  {
    slug: "",
    title: "All Components",
  },
  {
    components: [
      registryComponents.accordion,
      registryComponents.card,
      registryComponents.carousel,
      registryComponents.collapsible,
      registryComponents["aspect-ratio"],
      registryComponents.resizable,
      registryComponents["scroll-area"],
      registryComponents.separator,
      registryComponents.skeleton,
    ],
    description: "Container and Layout components",
    title: "Container & Layout",
  },
  {
    components: [
      registryComponents.breadcrumb,
      registryComponents.menubar,
      registryComponents["navigation-menu"],
      registryComponents.tabs,
      registryComponents["context-menu"],
      registryComponents["dropdown-menu"],
      registryComponents.command,
    ],
    description: "Navigation & Menu components",
    title: "Navigation & Menu",
  },
  {
    components: [
      registryComponents["alert-dialog"],
      registryComponents.dialog,
      registryComponents.drawer,
      registryComponents.sheet,
      registryComponents.popover,
      registryComponents.tooltip,
      registryComponents["hover-card"],
    ],
    description: "Overlay, Dialog & Popups components",
    title: "Overlay & Dialog",
  },
  {
    components: [
      registryComponents.form,
      registryComponents.button,
      registryComponents.input,
      registryComponents["input-date"],
      registryComponents["input-number"],
      registryComponents["input-otp"],
      registryComponents["input-password"],
      registryComponents["input-search"],
      registryComponents["input-time"],
      registryComponents["date-picker"],
      registryComponents.calendar,
      registryComponents.checkbox,
      registryComponents["checkbox-group"],
      registryComponents["checkbox-cards"],
      registryComponents.radio,
      registryComponents["radio-group"],
      registryComponents["radio-cards"],
      registryComponents.switch,
      registryComponents.toggle,
      registryComponents["toggle-group"],
      registryComponents.textarea,
      registryComponents.combobox,
      registryComponents.select,
      registryComponents.label,
      registryComponents.slider,
    ],
    description: "Input & Form Components",
    title: "Forms & Input",
  },
  {
    components: [
      registryComponents.alert,
      registryComponents.avatar,
      registryComponents.badge,
      registryComponents.progress,
      registryComponents["progress-circle"],
      registryComponents.sonner,
      registryComponents.chart,
      registryComponents.table,
      registryComponents.pagination,
    ],
    description: "Response, Notification & Data Display components",
    title: "Feedback & Data Display",
  },
  {
    components: [registryComponents.kbd],
    description: "Utilities & Auxiliary Components",
    title: "Utilities",
  },
];
