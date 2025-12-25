import { lazy } from 'react';
import type { ComponentType } from 'react';

export type ComponentConfig = {
  name: string;
  component: ComponentType;
  className?: string;
  type: 'registry:ui' | 'registry:page' | 'registry:block';
  href: string;
  label?: string;
};

const EmptyComponent = () => null;

export const componentRegistry: Record<string, ComponentConfig> = {
  accordion: {
    name: 'Accordion',
    component: lazy(() => import('@/components/sink/demos/accordion-demo').then((m) => ({ default: m.AccordionDemo }))),
    type: 'registry:ui',
    href: '/sink/accordion',
  },
  alert: {
    name: 'Alert',
    component: lazy(() => import('@/components/sink/demos/alert-demo').then((m) => ({ default: m.AlertDemo }))),
    type: 'registry:ui',
    href: '/sink/alert',
  },
  'alert-dialog': {
    name: 'Alert Dialog',
    component: lazy(() =>
      import('@/components/sink/demos/alert-dialog-demo').then((m) => ({ default: m.AlertDialogDemo })),
    ),
    type: 'registry:ui',
    href: '/sink/alert-dialog',
  },
  'aspect-ratio': {
    name: 'Aspect Ratio',
    component: lazy(() =>
      import('@/components/sink/demos/aspect-ratio-demo').then((m) => ({ default: m.AspectRatioDemo })),
    ),
    type: 'registry:ui',
    href: '/sink/aspect-ratio',
  },
  avatar: {
    name: 'Avatar',
    component: lazy(() => import('@/components/sink/demos/avatar-demo').then((m) => ({ default: m.AvatarDemo }))),
    type: 'registry:ui',
    href: '/sink/avatar',
  },
  badge: {
    name: 'Badge',
    component: lazy(() => import('@/components/sink/demos/badge-demo').then((m) => ({ default: m.BadgeDemo }))),
    type: 'registry:ui',
    href: '/sink/badge',
  },
  breadcrumb: {
    name: 'Breadcrumb',
    component: lazy(() =>
      import('@/components/sink/demos/breadcrumb-demo').then((m) => ({ default: m.BreadcrumbDemo })),
    ),
    type: 'registry:ui',
    href: '/sink/breadcrumb',
  },
  button: {
    name: 'Button',
    component: lazy(() => import('@/components/sink/demos/button-demo').then((m) => ({ default: m.ButtonDemo }))),
    type: 'registry:ui',
    href: '/sink/button',
  },
  'button-group': {
    name: 'Button Group',
    component: lazy(() =>
      import('@/components/sink/demos/button-group-demo').then((m) => ({ default: m.ButtonGroupDemo })),
    ),
    type: 'registry:ui',
    href: '/sink/button-group',
    label: 'New',
  },
  calendar: {
    name: 'Calendar',
    component: lazy(() => import('@/components/sink/demos/calendar-demo').then((m) => ({ default: m.CalendarDemo }))),
    type: 'registry:ui',
    href: '/sink/calendar',
  },
  card: {
    name: 'Card',
    component: lazy(() => import('@/components/sink/demos/card-demo').then((m) => ({ default: m.CardDemo }))),
    type: 'registry:ui',
    href: '/sink/card',
  },
  carousel: {
    name: 'Carousel',
    component: lazy(() => import('@/components/sink/demos/carousel-demo').then((m) => ({ default: m.CarouselDemo }))),
    type: 'registry:ui',
    href: '/sink/carousel',
  },
  chart: {
    name: 'Chart',
    component: lazy(() => import('@/components/sink/demos/chart-demo').then((m) => ({ default: m.ChartDemo }))),
    className: 'w-full',
    type: 'registry:ui',
    href: '/sink/chart',
  },
  checkbox: {
    name: 'Checkbox',
    component: lazy(() => import('@/components/sink/demos/checkbox-demo').then((m) => ({ default: m.CheckboxDemo }))),
    type: 'registry:ui',
    href: '/sink/checkbox',
  },
  collapsible: {
    name: 'Collapsible',
    component: lazy(() =>
      import('@/components/sink/demos/collapsible-demo').then((m) => ({ default: m.CollapsibleDemo })),
    ),
    type: 'registry:ui',
    href: '/sink/collapsible',
  },
  combobox: {
    name: 'Combobox',
    component: lazy(() => import('@/components/sink/demos/combobox-demo').then((m) => ({ default: m.ComboboxDemo }))),
    type: 'registry:ui',
    href: '/sink/combobox',
  },
  command: {
    name: 'Command',
    component: lazy(() => import('@/components/sink/demos/command-demo').then((m) => ({ default: m.CommandDemo }))),
    type: 'registry:ui',
    href: '/sink/command',
  },
  'context-menu': {
    name: 'Context Menu',
    component: lazy(() =>
      import('@/components/sink/demos/context-menu-demo').then((m) => ({ default: m.ContextMenuDemo })),
    ),
    type: 'registry:ui',
    href: '/sink/context-menu',
  },
  'date-picker': {
    name: 'Date Picker',
    component: lazy(() =>
      import('@/components/sink/demos/date-picker-demo').then((m) => ({ default: m.DatePickerDemo })),
    ),
    type: 'registry:ui',
    href: '/sink/date-picker',
  },
  dialog: {
    name: 'Dialog',
    component: lazy(() => import('@/components/sink/demos/dialog-demo').then((m) => ({ default: m.DialogDemo }))),
    type: 'registry:ui',
    href: '/sink/dialog',
  },
  drawer: {
    name: 'Drawer',
    component: lazy(() => import('@/components/sink/demos/drawer-demo').then((m) => ({ default: m.DrawerDemo }))),
    type: 'registry:ui',
    href: '/sink/drawer',
  },
  'dropdown-menu': {
    name: 'Dropdown Menu',
    component: lazy(() =>
      import('@/components/sink/demos/dropdown-menu-demo').then((m) => ({ default: m.DropdownMenuDemo })),
    ),
    type: 'registry:ui',
    href: '/sink/dropdown-menu',
  },
  empty: {
    name: 'Empty',
    component: lazy(() => import('@/components/sink/demos/empty-demo').then((m) => ({ default: m.EmptyDemo }))),
    type: 'registry:ui',
    href: '/sink/empty',
    label: 'New',
  },
  field: {
    name: 'Field',
    component: lazy(() => import('@/components/sink/demos/field-demo').then((m) => ({ default: m.FieldDemo }))),
    type: 'registry:ui',
    href: '/sink/field',
    label: 'New',
  },
  form: {
    name: 'Form',
    component: lazy(() => import('@/components/sink/demos/form-demo').then((m) => ({ default: m.FormDemo }))),
    type: 'registry:ui',
    href: '/sink/form',
  },
  'hover-card': {
    name: 'Hover Card',
    component: lazy(() =>
      import('@/components/sink/demos/hover-card-demo').then((m) => ({ default: m.HoverCardDemo })),
    ),
    type: 'registry:ui',
    href: '/sink/hover-card',
  },
  input: {
    name: 'Input',
    component: lazy(() => import('@/components/sink/demos/input-demo').then((m) => ({ default: m.InputDemo }))),
    type: 'registry:ui',
    href: '/sink/input',
  },
  'input-group': {
    name: 'Input Group',
    component: lazy(() =>
      import('@/components/sink/demos/input-group-demo').then((m) => ({ default: m.InputGroupDemo })),
    ),
    type: 'registry:ui',
    href: '/sink/input-group',
    label: 'New',
  },
  'input-otp': {
    name: 'Input OTP',
    component: lazy(() => import('@/components/sink/demos/input-otp-demo').then((m) => ({ default: m.InputOTPDemo }))),
    type: 'registry:ui',
    href: '/sink/input-otp',
  },
  item: {
    name: 'Item',
    component: lazy(() => import('@/components/sink/demos/item-demo').then((m) => ({ default: m.ItemDemo }))),
    type: 'registry:ui',
    href: '/sink/item',
    label: 'New',
  },
  kbd: {
    name: 'Kbd',
    component: lazy(() => import('@/components/sink/demos/kbd-demo').then((m) => ({ default: m.KbdDemo }))),
    type: 'registry:ui',
    href: '/sink/kbd',
    label: 'New',
  },
  label: {
    name: 'Label',
    component: lazy(() => import('@/components/sink/demos/label-demo').then((m) => ({ default: m.LabelDemo }))),
    type: 'registry:ui',
    href: '/sink/label',
  },
  menubar: {
    name: 'Menubar',
    component: lazy(() => import('@/components/sink/demos/menubar-demo').then((m) => ({ default: m.MenubarDemo }))),
    type: 'registry:ui',
    href: '/sink/menubar',
  },
  'navigation-menu': {
    name: 'Navigation Menu',
    component: lazy(() =>
      import('@/components/sink/demos/navigation-menu-demo').then((m) => ({ default: m.NavigationMenuDemo })),
    ),
    type: 'registry:ui',
    href: '/sink/navigation-menu',
  },
  'native-select': {
    name: 'Native Select',
    component: lazy(() =>
      import('@/components/sink/demos/native-select-demo').then((m) => ({ default: m.NativeSelectDemo })),
    ),
    type: 'registry:ui',
    href: '/sink/native-select',
    label: 'New',
  },
  pagination: {
    name: 'Pagination',
    component: lazy(() =>
      import('@/components/sink/demos/pagination-demo').then((m) => ({ default: m.PaginationDemo })),
    ),
    type: 'registry:ui',
    href: '/sink/pagination',
  },
  popover: {
    name: 'Popover',
    component: lazy(() => import('@/components/sink/demos/popover-demo').then((m) => ({ default: m.PopoverDemo }))),
    type: 'registry:ui',
    href: '/sink/popover',
  },
  progress: {
    name: 'Progress',
    component: lazy(() => import('@/components/sink/demos/progress-demo').then((m) => ({ default: m.ProgressDemo }))),
    type: 'registry:ui',
    href: '/sink/progress',
  },
  'radio-group': {
    name: 'Radio Group',
    component: lazy(() =>
      import('@/components/sink/demos/radio-group-demo').then((m) => ({ default: m.RadioGroupDemo })),
    ),
    type: 'registry:ui',
    href: '/sink/radio-group',
  },
  resizable: {
    name: 'Resizable',
    component: lazy(() => import('@/components/sink/demos/resizable-demo').then((m) => ({ default: m.ResizableDemo }))),
    type: 'registry:ui',
    href: '/sink/resizable',
  },
  'scroll-area': {
    name: 'Scroll Area',
    component: lazy(() =>
      import('@/components/sink/demos/scroll-area-demo').then((m) => ({ default: m.ScrollAreaDemo })),
    ),
    type: 'registry:ui',
    href: '/sink/scroll-area',
  },
  select: {
    name: 'Select',
    component: lazy(() => import('@/components/sink/demos/select-demo').then((m) => ({ default: m.SelectDemo }))),
    type: 'registry:ui',
    href: '/sink/select',
  },
  separator: {
    name: 'Separator',
    component: lazy(() => import('@/components/sink/demos/separator-demo').then((m) => ({ default: m.SeparatorDemo }))),
    type: 'registry:ui',
    href: '/sink/separator',
  },
  sheet: {
    name: 'Sheet',
    component: lazy(() => import('@/components/sink/demos/sheet-demo').then((m) => ({ default: m.SheetDemo }))),
    type: 'registry:ui',
    href: '/sink/sheet',
  },
  skeleton: {
    name: 'Skeleton',
    component: lazy(() => import('@/components/sink/demos/skeleton-demo').then((m) => ({ default: m.SkeletonDemo }))),
    type: 'registry:ui',
    href: '/sink/skeleton',
  },
  slider: {
    name: 'Slider',
    component: lazy(() => import('@/components/sink/demos/slider-demo').then((m) => ({ default: m.SliderDemo }))),
    type: 'registry:ui',
    href: '/sink/slider',
  },
  sonner: {
    name: 'Sonner',
    component: lazy(() => import('@/components/sink/demos/sonner-demo').then((m) => ({ default: m.SonnerDemo }))),
    type: 'registry:ui',
    href: '/sink/sonner',
  },
  spinner: {
    name: 'Spinner',
    component: lazy(() => import('@/components/sink/demos/spinner-demo').then((m) => ({ default: m.SpinnerDemo }))),
    type: 'registry:ui',
    href: '/sink/spinner',
    label: 'New',
  },
  switch: {
    name: 'Switch',
    component: lazy(() => import('@/components/sink/demos/switch-demo').then((m) => ({ default: m.SwitchDemo }))),
    type: 'registry:ui',
    href: '/sink/switch',
  },
  table: {
    name: 'Table',
    component: lazy(() => import('@/components/sink/demos/table-demo').then((m) => ({ default: m.TableDemo }))),
    type: 'registry:ui',
    href: '/sink/table',
  },
  tabs: {
    name: 'Tabs',
    component: lazy(() => import('@/components/sink/demos/tabs-demo').then((m) => ({ default: m.TabsDemo }))),
    type: 'registry:ui',
    href: '/sink/tabs',
  },
  textarea: {
    name: 'Textarea',
    component: lazy(() => import('@/components/sink/demos/textarea-demo').then((m) => ({ default: m.TextareaDemo }))),
    type: 'registry:ui',
    href: '/sink/textarea',
  },
  toggle: {
    name: 'Toggle',
    component: lazy(() => import('@/components/sink/demos/toggle-demo').then((m) => ({ default: m.ToggleDemo }))),
    type: 'registry:ui',
    href: '/sink/toggle',
  },
  'toggle-group': {
    name: 'Toggle Group',
    component: lazy(() =>
      import('@/components/sink/demos/toggle-group-demo').then((m) => ({ default: m.ToggleGroupDemo })),
    ),
    type: 'registry:ui',
    href: '/sink/toggle-group',
  },
  tooltip: {
    name: 'Tooltip',
    component: lazy(() => import('@/components/sink/demos/tooltip-demo').then((m) => ({ default: m.TooltipDemo }))),
    type: 'registry:ui',
    href: '/sink/tooltip',
  },
  blocks: {
    name: 'Forms',
    component: EmptyComponent,
    type: 'registry:page',
    href: '/sink/forms',
  },
  'start-form': {
    name: 'TanStack Start Form',
    component: EmptyComponent,
    type: 'registry:page',
    href: '/sink/start-form',
  },
  'tanstack-form': {
    name: 'Tanstack Form',
    component: EmptyComponent,
    type: 'registry:page',
    href: '/sink/tanstack-form',
  },
  'react-hook-form': {
    name: 'React Hook Form',
    component: EmptyComponent,
    type: 'registry:page',
    href: '/sink/react-hook-form',
  },
};
