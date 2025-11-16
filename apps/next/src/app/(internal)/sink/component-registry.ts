import FormsPage from "@/app/(internal)/sink/(pages)/forms/page";
import NextFormPage from "@/app/(internal)/sink/(pages)/next-form/page";
import ReactHookFormPage from "@/app/(internal)/sink/(pages)/react-hook-form/page";
import TanstackFormPage from "@/app/(internal)/sink/(pages)/tanstack-form/page";

import { AccordionDemo } from "@/app/(internal)/sink/components/accordion-demo";
import { AlertDemo } from "@/app/(internal)/sink/components/alert-demo";
import { AlertDialogDemo } from "@/app/(internal)/sink/components/alert-dialog-demo";
import { AspectRatioDemo } from "@/app/(internal)/sink/components/aspect-ratio-demo";
import { AvatarDemo } from "@/app/(internal)/sink/components/avatar-demo";
import { BadgeDemo } from "@/app/(internal)/sink/components/badge-demo";
import { BreadcrumbDemo } from "@/app/(internal)/sink/components/breadcrumb-demo";
import { ButtonDemo } from "@/app/(internal)/sink/components/button-demo";
import { ButtonGroupDemo } from "@/app/(internal)/sink/components/button-group-demo";
import { CalendarDemo } from "@/app/(internal)/sink/components/calendar-demo";
import { CardDemo } from "@/app/(internal)/sink/components/card-demo";
import { CarouselDemo } from "@/app/(internal)/sink/components/carousel-demo";
import { ChartDemo } from "@/app/(internal)/sink/components/chart-demo";
import { CheckboxDemo } from "@/app/(internal)/sink/components/checkbox-demo";
import { CollapsibleDemo } from "@/app/(internal)/sink/components/collapsible-demo";
import { ComboboxDemo } from "@/app/(internal)/sink/components/combobox-demo";
import { CommandDemo } from "@/app/(internal)/sink/components/command-demo";
import { ContextMenuDemo } from "@/app/(internal)/sink/components/context-menu-demo";
import { DatePickerDemo } from "@/app/(internal)/sink/components/date-picker-demo";
import { DialogDemo } from "@/app/(internal)/sink/components/dialog-demo";
import { DrawerDemo } from "@/app/(internal)/sink/components/drawer-demo";
import { DropdownMenuDemo } from "@/app/(internal)/sink/components/dropdown-menu-demo";
import { EmptyDemo } from "@/app/(internal)/sink/components/empty-demo";
import { FieldDemo } from "@/app/(internal)/sink/components/field-demo";
import { FormDemo } from "@/app/(internal)/sink/components/form-demo";
import { HoverCardDemo } from "@/app/(internal)/sink/components/hover-card-demo";
import { InputDemo } from "@/app/(internal)/sink/components/input-demo";
import { InputGroupDemo } from "@/app/(internal)/sink/components/input-group-demo";
import { InputOTPDemo } from "@/app/(internal)/sink/components/input-otp-demo";
import { ItemDemo } from "@/app/(internal)/sink/components/item-demo";
import { KbdDemo } from "@/app/(internal)/sink/components/kbd-demo";
import { LabelDemo } from "@/app/(internal)/sink/components/label-demo";
import { MenubarDemo } from "@/app/(internal)/sink/components/menubar-demo";
import { NativeSelectDemo } from "@/app/(internal)/sink/components/native-select-demo";
import { NavigationMenuDemo } from "@/app/(internal)/sink/components/navigation-menu-demo";
import { PaginationDemo } from "@/app/(internal)/sink/components/pagination-demo";
import { PopoverDemo } from "@/app/(internal)/sink/components/popover-demo";
import { ProgressDemo } from "@/app/(internal)/sink/components/progress-demo";
import { RadioGroupDemo } from "@/app/(internal)/sink/components/radio-group-demo";
import { ResizableDemo } from "@/app/(internal)/sink/components/resizable-demo";
import { ScrollAreaDemo } from "@/app/(internal)/sink/components/scroll-area-demo";
import { SelectDemo } from "@/app/(internal)/sink/components/select-demo";
import { SeparatorDemo } from "@/app/(internal)/sink/components/separator-demo";
import { SheetDemo } from "@/app/(internal)/sink/components/sheet-demo";
import { SkeletonDemo } from "@/app/(internal)/sink/components/skeleton-demo";
import { SliderDemo } from "@/app/(internal)/sink/components/slider-demo";
import { SonnerDemo } from "@/app/(internal)/sink/components/sonner-demo";
import { SpinnerDemo } from "@/app/(internal)/sink/components/spinner-demo";
import { SwitchDemo } from "@/app/(internal)/sink/components/switch-demo";
import { TableDemo } from "@/app/(internal)/sink/components/table-demo";
import { TabsDemo } from "@/app/(internal)/sink/components/tabs-demo";
import { TextareaDemo } from "@/app/(internal)/sink/components/textarea-demo";
import { ToggleDemo } from "@/app/(internal)/sink/components/toggle-demo";
import { ToggleGroupDemo } from "@/app/(internal)/sink/components/toggle-group-demo";
import { TooltipDemo } from "@/app/(internal)/sink/components/tooltip-demo";

type ComponentConfig = {
  name: string;
  component: React.ComponentType;
  className?: string;
  type: "registry:ui" | "registry:page" | "registry:block";
  href: string;
  label?: string;
};

export const componentRegistry: Record<string, ComponentConfig> = {
  accordion: {
    name: "Accordion",
    component: AccordionDemo,
    type: "registry:ui",
    href: "/sink/accordion",
  },
  alert: {
    name: "Alert",
    component: AlertDemo,
    type: "registry:ui",
    href: "/sink/alert",
  },
  "alert-dialog": {
    name: "Alert Dialog",
    component: AlertDialogDemo,
    type: "registry:ui",
    href: "/sink/alert-dialog",
  },
  "aspect-ratio": {
    name: "Aspect Ratio",
    component: AspectRatioDemo,
    type: "registry:ui",
    href: "/sink/aspect-ratio",
  },
  avatar: {
    name: "Avatar",
    component: AvatarDemo,
    type: "registry:ui",
    href: "/sink/avatar",
  },
  badge: {
    name: "Badge",
    component: BadgeDemo,
    type: "registry:ui",
    href: "/sink/badge",
  },
  breadcrumb: {
    name: "Breadcrumb",
    component: BreadcrumbDemo,
    type: "registry:ui",
    href: "/sink/breadcrumb",
  },
  button: {
    name: "Button",
    component: ButtonDemo,
    type: "registry:ui",
    href: "/sink/button",
  },
  "button-group": {
    name: "Button Group",
    component: ButtonGroupDemo,
    type: "registry:ui",
    href: "/sink/button-group",
    label: "New",
  },
  calendar: {
    name: "Calendar",
    component: CalendarDemo,
    type: "registry:ui",
    href: "/sink/calendar",
  },
  card: {
    name: "Card",
    component: CardDemo,
    type: "registry:ui",
    href: "/sink/card",
  },
  carousel: {
    name: "Carousel",
    component: CarouselDemo,
    type: "registry:ui",
    href: "/sink/carousel",
  },
  chart: {
    name: "Chart",
    component: ChartDemo,
    className: "w-full",
    type: "registry:ui",
    href: "/sink/chart",
  },
  checkbox: {
    name: "Checkbox",
    component: CheckboxDemo,
    type: "registry:ui",
    href: "/sink/checkbox",
  },
  collapsible: {
    name: "Collapsible",
    component: CollapsibleDemo,
    type: "registry:ui",
    href: "/sink/collapsible",
  },
  combobox: {
    name: "Combobox",
    component: ComboboxDemo,
    type: "registry:ui",
    href: "/sink/combobox",
  },
  command: {
    name: "Command",
    component: CommandDemo,
    type: "registry:ui",
    href: "/sink/command",
  },
  "context-menu": {
    name: "Context Menu",
    component: ContextMenuDemo,
    type: "registry:ui",
    href: "/sink/context-menu",
  },
  "date-picker": {
    name: "Date Picker",
    component: DatePickerDemo,
    type: "registry:ui",
    href: "/sink/date-picker",
  },
  dialog: {
    name: "Dialog",
    component: DialogDemo,
    type: "registry:ui",
    href: "/sink/dialog",
  },
  drawer: {
    name: "Drawer",
    component: DrawerDemo,
    type: "registry:ui",
    href: "/sink/drawer",
  },
  "dropdown-menu": {
    name: "Dropdown Menu",
    component: DropdownMenuDemo,
    type: "registry:ui",
    href: "/sink/dropdown-menu",
  },
  empty: {
    name: "Empty",
    component: EmptyDemo,
    type: "registry:ui",
    href: "/sink/empty",
    label: "New",
  },
  field: {
    name: "Field",
    component: FieldDemo,
    type: "registry:ui",
    href: "/sink/field",
    label: "New",
  },
  form: {
    name: "Form",
    component: FormDemo,
    type: "registry:ui",
    href: "/sink/form",
  },
  "hover-card": {
    name: "Hover Card",
    component: HoverCardDemo,
    type: "registry:ui",
    href: "/sink/hover-card",
  },
  input: {
    name: "Input",
    component: InputDemo,
    type: "registry:ui",
    href: "/sink/input",
  },
  "input-group": {
    name: "Input Group",
    component: InputGroupDemo,
    type: "registry:ui",
    href: "/sink/input-group",
    label: "New",
  },
  "input-otp": {
    name: "Input OTP",
    component: InputOTPDemo,
    type: "registry:ui",
    href: "/sink/input-otp",
  },
  item: {
    name: "Item",
    component: ItemDemo,
    type: "registry:ui",
    href: "/sink/item",
    label: "New",
  },
  kbd: {
    name: "Kbd",
    component: KbdDemo,
    type: "registry:ui",
    href: "/sink/kbd",
    label: "New",
  },
  label: {
    name: "Label",
    component: LabelDemo,
    type: "registry:ui",
    href: "/sink/label",
  },
  menubar: {
    name: "Menubar",
    component: MenubarDemo,
    type: "registry:ui",
    href: "/sink/menubar",
  },
  "navigation-menu": {
    name: "Navigation Menu",
    component: NavigationMenuDemo,
    type: "registry:ui",
    href: "/sink/navigation-menu",
  },
  "native-select": {
    name: "Native Select",
    component: NativeSelectDemo,
    type: "registry:ui",
    href: "/sink/native-select",
    label: "New",
  },
  pagination: {
    name: "Pagination",
    component: PaginationDemo,
    type: "registry:ui",
    href: "/sink/pagination",
  },
  popover: {
    name: "Popover",
    component: PopoverDemo,
    type: "registry:ui",
    href: "/sink/popover",
  },
  progress: {
    name: "Progress",
    component: ProgressDemo,
    type: "registry:ui",
    href: "/sink/progress",
  },
  "radio-group": {
    name: "Radio Group",
    component: RadioGroupDemo,
    type: "registry:ui",
    href: "/sink/radio-group",
  },
  resizable: {
    name: "Resizable",
    component: ResizableDemo,
    type: "registry:ui",
    href: "/sink/resizable",
  },
  "scroll-area": {
    name: "Scroll Area",
    component: ScrollAreaDemo,
    type: "registry:ui",
    href: "/sink/scroll-area",
  },
  select: {
    name: "Select",
    component: SelectDemo,
    type: "registry:ui",
    href: "/sink/select",
  },
  separator: {
    name: "Separator",
    component: SeparatorDemo,
    type: "registry:ui",
    href: "/sink/separator",
  },
  sheet: {
    name: "Sheet",
    component: SheetDemo,
    type: "registry:ui",
    href: "/sink/sheet",
  },
  skeleton: {
    name: "Skeleton",
    component: SkeletonDemo,
    type: "registry:ui",
    href: "/sink/skeleton",
  },
  slider: {
    name: "Slider",
    component: SliderDemo,
    type: "registry:ui",
    href: "/sink/slider",
  },
  sonner: {
    name: "Sonner",
    component: SonnerDemo,
    type: "registry:ui",
    href: "/sink/sonner",
  },
  spinner: {
    name: "Spinner",
    component: SpinnerDemo,
    type: "registry:ui",
    href: "/sink/spinner",
    label: "New",
  },
  switch: {
    name: "Switch",
    component: SwitchDemo,
    type: "registry:ui",
    href: "/sink/switch",
  },
  table: {
    name: "Table",
    component: TableDemo,
    type: "registry:ui",
    href: "/sink/table",
  },
  tabs: {
    name: "Tabs",
    component: TabsDemo,
    type: "registry:ui",
    href: "/sink/tabs",
  },
  textarea: {
    name: "Textarea",
    component: TextareaDemo,
    type: "registry:ui",
    href: "/sink/textarea",
  },
  toggle: {
    name: "Toggle",
    component: ToggleDemo,
    type: "registry:ui",
    href: "/sink/toggle",
  },
  "toggle-group": {
    name: "Toggle Group",
    component: ToggleGroupDemo,
    type: "registry:ui",
    href: "/sink/toggle-group",
  },
  tooltip: {
    name: "Tooltip",
    component: TooltipDemo,
    type: "registry:ui",
    href: "/sink/tooltip",
  },
  blocks: {
    name: "Forms",
    component: FormsPage,
    type: "registry:page",
    href: "/sink/forms",
  },
  "next-form": {
    name: "Next.js Form",
    component: NextFormPage,
    type: "registry:page",
    href: "/sink/next-form",
  },
  "tanstack-form": {
    name: "Tanstack Form",
    component: TanstackFormPage,
    type: "registry:page",
    href: "/sink/tanstack-form",
  },
  "react-hook-form": {
    name: "React Hook Form",
    component: ReactHookFormPage,
    type: "registry:page",
    href: "/sink/react-hook-form",
  },
};

export type ComponentKey = keyof typeof componentRegistry;
