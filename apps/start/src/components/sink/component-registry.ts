import type { ComponentType } from 'react';
import { AccordionDemo } from '@/components/sink/demos/accordion-demo';
import { AlertDemo } from '@/components/sink/demos/alert-demo';
import { AlertDialogDemo } from '@/components/sink/demos/alert-dialog-demo';
import { AspectRatioDemo } from '@/components/sink/demos/aspect-ratio-demo';
import { AvatarDemo } from '@/components/sink/demos/avatar-demo';
import { BadgeDemo } from '@/components/sink/demos/badge-demo';
import { BreadcrumbDemo } from '@/components/sink/demos/breadcrumb-demo';
import { ButtonDemo } from '@/components/sink/demos/button-demo';
import { ButtonGroupDemo } from '@/components/sink/demos/button-group-demo';
import { CalendarDemo } from '@/components/sink/demos/calendar-demo';
import { CardDemo } from '@/components/sink/demos/card-demo';
import { CarouselDemo } from '@/components/sink/demos/carousel-demo';
import { ChartDemo } from '@/components/sink/demos/chart-demo';
import { CheckboxDemo } from '@/components/sink/demos/checkbox-demo';
import { CollapsibleDemo } from '@/components/sink/demos/collapsible-demo';
import { ComboboxDemo } from '@/components/sink/demos/combobox-demo';
import { CommandDemo } from '@/components/sink/demos/command-demo';
import { ContextMenuDemo } from '@/components/sink/demos/context-menu-demo';
import { DatePickerDemo } from '@/components/sink/demos/date-picker-demo';
import { DialogDemo } from '@/components/sink/demos/dialog-demo';
import { DrawerDemo } from '@/components/sink/demos/drawer-demo';
import { DropdownMenuDemo } from '@/components/sink/demos/dropdown-menu-demo';
import { EmptyDemo } from '@/components/sink/demos/empty-demo';
import { FieldDemo } from '@/components/sink/demos/field-demo';
import { FormDemo } from '@/components/sink/demos/form-demo';
import { HoverCardDemo } from '@/components/sink/demos/hover-card-demo';
import { InputDemo } from '@/components/sink/demos/input-demo';
import { InputGroupDemo } from '@/components/sink/demos/input-group-demo';
import { InputOTPDemo } from '@/components/sink/demos/input-otp-demo';
import { ItemDemo } from '@/components/sink/demos/item-demo';
import { KbdDemo } from '@/components/sink/demos/kbd-demo';
import { LabelDemo } from '@/components/sink/demos/label-demo';
import { MenubarDemo } from '@/components/sink/demos/menubar-demo';
import { NativeSelectDemo } from '@/components/sink/demos/native-select-demo';
import { NavigationMenuDemo } from '@/components/sink/demos/navigation-menu-demo';
import { PaginationDemo } from '@/components/sink/demos/pagination-demo';
import { PopoverDemo } from '@/components/sink/demos/popover-demo';
import { ProgressDemo } from '@/components/sink/demos/progress-demo';
import { RadioGroupDemo } from '@/components/sink/demos/radio-group-demo';
import { ResizableDemo } from '@/components/sink/demos/resizable-demo';
import { ScrollAreaDemo } from '@/components/sink/demos/scroll-area-demo';
import { SelectDemo } from '@/components/sink/demos/select-demo';
import { SeparatorDemo } from '@/components/sink/demos/separator-demo';
import { SheetDemo } from '@/components/sink/demos/sheet-demo';
import { SkeletonDemo } from '@/components/sink/demos/skeleton-demo';
import { SliderDemo } from '@/components/sink/demos/slider-demo';
import { SonnerDemo } from '@/components/sink/demos/sonner-demo';
import { SpinnerDemo } from '@/components/sink/demos/spinner-demo';
import { SwitchDemo } from '@/components/sink/demos/switch-demo';
import { TableDemo } from '@/components/sink/demos/table-demo';
import { TabsDemo } from '@/components/sink/demos/tabs-demo';
import { TextareaDemo } from '@/components/sink/demos/textarea-demo';
import { ToggleDemo } from '@/components/sink/demos/toggle-demo';
import { ToggleGroupDemo } from '@/components/sink/demos/toggle-group-demo';
import { TooltipDemo } from '@/components/sink/demos/tooltip-demo';

type ComponentConfig = {
  name: string;
  component: ComponentType;
  className?: string;
  type: 'registry:ui' | 'registry:page' | 'registry:block';
  href: string;
  label?: string;
};

export const componentRegistry: Record<string, ComponentConfig> = {
  accordion: {
    name: 'Accordion',
    component: AccordionDemo,
    type: 'registry:ui',
    href: '/sink/accordion',
  },
  alert: {
    name: 'Alert',
    component: AlertDemo,
    type: 'registry:ui',
    href: '/sink/alert',
  },
  'alert-dialog': {
    name: 'Alert Dialog',
    component: AlertDialogDemo,
    type: 'registry:ui',
    href: '/sink/alert-dialog',
  },
  'aspect-ratio': {
    name: 'Aspect Ratio',
    component: AspectRatioDemo,
    type: 'registry:ui',
    href: '/sink/aspect-ratio',
  },
  avatar: {
    name: 'Avatar',
    component: AvatarDemo,
    type: 'registry:ui',
    href: '/sink/avatar',
  },
  badge: {
    name: 'Badge',
    component: BadgeDemo,
    type: 'registry:ui',
    href: '/sink/badge',
  },
  breadcrumb: {
    name: 'Breadcrumb',
    component: BreadcrumbDemo,
    type: 'registry:ui',
    href: '/sink/breadcrumb',
  },
  button: {
    name: 'Button',
    component: ButtonDemo,
    type: 'registry:ui',
    href: '/sink/button',
  },
  'button-group': {
    name: 'Button Group',
    component: ButtonGroupDemo,
    type: 'registry:ui',
    href: '/sink/button-group',
    label: 'New',
  },
  calendar: {
    name: 'Calendar',
    component: CalendarDemo,
    type: 'registry:ui',
    href: '/sink/calendar',
  },
  card: {
    name: 'Card',
    component: CardDemo,
    type: 'registry:ui',
    href: '/sink/card',
  },
  carousel: {
    name: 'Carousel',
    component: CarouselDemo,
    type: 'registry:ui',
    href: '/sink/carousel',
  },
  chart: {
    name: 'Chart',
    component: ChartDemo,
    className: 'w-full',
    type: 'registry:ui',
    href: '/sink/chart',
  },
  checkbox: {
    name: 'Checkbox',
    component: CheckboxDemo,
    type: 'registry:ui',
    href: '/sink/checkbox',
  },
  collapsible: {
    name: 'Collapsible',
    component: CollapsibleDemo,
    type: 'registry:ui',
    href: '/sink/collapsible',
  },
  combobox: {
    name: 'Combobox',
    component: ComboboxDemo,
    type: 'registry:ui',
    href: '/sink/combobox',
  },
  command: {
    name: 'Command',
    component: CommandDemo,
    type: 'registry:ui',
    href: '/sink/command',
  },
  'context-menu': {
    name: 'Context Menu',
    component: ContextMenuDemo,
    type: 'registry:ui',
    href: '/sink/context-menu',
  },
  'date-picker': {
    name: 'Date Picker',
    component: DatePickerDemo,
    type: 'registry:ui',
    href: '/sink/date-picker',
  },
  dialog: {
    name: 'Dialog',
    component: DialogDemo,
    type: 'registry:ui',
    href: '/sink/dialog',
  },
  drawer: {
    name: 'Drawer',
    component: DrawerDemo,
    type: 'registry:ui',
    href: '/sink/drawer',
  },
  'dropdown-menu': {
    name: 'Dropdown Menu',
    component: DropdownMenuDemo,
    type: 'registry:ui',
    href: '/sink/dropdown-menu',
  },
  empty: {
    name: 'Empty',
    component: EmptyDemo,
    type: 'registry:ui',
    href: '/sink/empty',
    label: 'New',
  },
  field: {
    name: 'Field',
    component: FieldDemo,
    type: 'registry:ui',
    href: '/sink/field',
    label: 'New',
  },
  form: {
    name: 'Form',
    component: FormDemo,
    type: 'registry:ui',
    href: '/sink/form',
  },
  'hover-card': {
    name: 'Hover Card',
    component: HoverCardDemo,
    type: 'registry:ui',
    href: '/sink/hover-card',
  },
  input: {
    name: 'Input',
    component: InputDemo,
    type: 'registry:ui',
    href: '/sink/input',
  },
  'input-group': {
    name: 'Input Group',
    component: InputGroupDemo,
    type: 'registry:ui',
    href: '/sink/input-group',
    label: 'New',
  },
  'input-otp': {
    name: 'Input OTP',
    component: InputOTPDemo,
    type: 'registry:ui',
    href: '/sink/input-otp',
  },
  item: {
    name: 'Item',
    component: ItemDemo,
    type: 'registry:ui',
    href: '/sink/item',
    label: 'New',
  },
  kbd: {
    name: 'Kbd',
    component: KbdDemo,
    type: 'registry:ui',
    href: '/sink/kbd',
    label: 'New',
  },
  label: {
    name: 'Label',
    component: LabelDemo,
    type: 'registry:ui',
    href: '/sink/label',
  },
  menubar: {
    name: 'Menubar',
    component: MenubarDemo,
    type: 'registry:ui',
    href: '/sink/menubar',
  },
  'navigation-menu': {
    name: 'Navigation Menu',
    component: NavigationMenuDemo,
    type: 'registry:ui',
    href: '/sink/navigation-menu',
  },
  'native-select': {
    name: 'Native Select',
    component: NativeSelectDemo,
    type: 'registry:ui',
    href: '/sink/native-select',
    label: 'New',
  },
  pagination: {
    name: 'Pagination',
    component: PaginationDemo,
    type: 'registry:ui',
    href: '/sink/pagination',
  },
  popover: {
    name: 'Popover',
    component: PopoverDemo,
    type: 'registry:ui',
    href: '/sink/popover',
  },
  progress: {
    name: 'Progress',
    component: ProgressDemo,
    type: 'registry:ui',
    href: '/sink/progress',
  },
  'radio-group': {
    name: 'Radio Group',
    component: RadioGroupDemo,
    type: 'registry:ui',
    href: '/sink/radio-group',
  },
  resizable: {
    name: 'Resizable',
    component: ResizableDemo,
    type: 'registry:ui',
    href: '/sink/resizable',
  },
  'scroll-area': {
    name: 'Scroll Area',
    component: ScrollAreaDemo,
    type: 'registry:ui',
    href: '/sink/scroll-area',
  },
  select: {
    name: 'Select',
    component: SelectDemo,
    type: 'registry:ui',
    href: '/sink/select',
  },
  separator: {
    name: 'Separator',
    component: SeparatorDemo,
    type: 'registry:ui',
    href: '/sink/separator',
  },
  sheet: {
    name: 'Sheet',
    component: SheetDemo,
    type: 'registry:ui',
    href: '/sink/sheet',
  },
  skeleton: {
    name: 'Skeleton',
    component: SkeletonDemo,
    type: 'registry:ui',
    href: '/sink/skeleton',
  },
  slider: {
    name: 'Slider',
    component: SliderDemo,
    type: 'registry:ui',
    href: '/sink/slider',
  },
  sonner: {
    name: 'Sonner',
    component: SonnerDemo,
    type: 'registry:ui',
    href: '/sink/sonner',
  },
  spinner: {
    name: 'Spinner',
    component: SpinnerDemo,
    type: 'registry:ui',
    href: '/sink/spinner',
    label: 'New',
  },
  switch: {
    name: 'Switch',
    component: SwitchDemo,
    type: 'registry:ui',
    href: '/sink/switch',
  },
  table: {
    name: 'Table',
    component: TableDemo,
    type: 'registry:ui',
    href: '/sink/table',
  },
  tabs: {
    name: 'Tabs',
    component: TabsDemo,
    type: 'registry:ui',
    href: '/sink/tabs',
  },
  textarea: {
    name: 'Textarea',
    component: TextareaDemo,
    type: 'registry:ui',
    href: '/sink/textarea',
  },
  toggle: {
    name: 'Toggle',
    component: ToggleDemo,
    type: 'registry:ui',
    href: '/sink/toggle',
  },
  'toggle-group': {
    name: 'Toggle Group',
    component: ToggleGroupDemo,
    type: 'registry:ui',
    href: '/sink/toggle-group',
  },
  tooltip: {
    name: 'Tooltip',
    component: TooltipDemo,
    type: 'registry:ui',
    href: '/sink/tooltip',
  },
  blocks: {
    name: 'Forms',
    component: () => null,
    type: 'registry:page',
    href: '/sink/forms',
  },
  'start-form': {
    name: 'TanStack Start Form',
    component: () => null,
    type: 'registry:page',
    href: '/sink/start-form',
  },
  'tanstack-form': {
    name: 'Tanstack Form',
    component: () => null,
    type: 'registry:page',
    href: '/sink/tanstack-form',
  },
  'react-hook-form': {
    name: 'React Hook Form',
    component: () => null,
    type: 'registry:page',
    href: '/sink/react-hook-form',
  },
};


