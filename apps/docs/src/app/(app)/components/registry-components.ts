import dynamic from 'next/dynamic';

import type { RegistryGroup, RegistryItem } from '@/types/registry';

export const registryComponents: Record<string, RegistryItem> = {
  accordion: {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/accordion-demo').then((mod) => mod.AccordionDemo),
    ),
    description: 'Accordion',
    slug: 'accordion',
    title: 'Accordion',
  },
  alert: {
    component: dynamic(() => import('@/app/(app)/components/_components/alert-demo').then((mod) => mod.AlertDemo)),
    description: 'Alert',
    slug: 'alert',
    title: 'Alert',
  },
  'alert-dialog': {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/alert-dialog-demo').then((mod) => mod.AlertDialogDemo),
    ),
    description: 'Alert Dialog',
    slug: 'alert-dialog',
    title: 'Alert Dialog',
  },
  'aspect-ratio': {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/aspect-ratio-demo').then((mod) => mod.AspectRatioDemo),
    ),
    description: 'Aspect Ratio',
    slug: 'aspect-ratio',
    title: 'Aspect Ratio',
  },
  avatar: {
    component: dynamic(() => import('@/app/(app)/components/_components/avatar-demo').then((mod) => mod.AvatarDemo)),
    description: 'Avatar',
    slug: 'avatar',
    title: 'Avatar',
  },
  badge: {
    component: dynamic(() => import('@/app/(app)/components/_components/badge-demo').then((mod) => mod.BadgeDemo)),
    description: 'Badge',
    slug: 'badge',
    title: 'Badge',
  },
  breadcrumb: {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/breadcrumb-demo').then((mod) => mod.BreadcrumbDemo),
    ),
    description: 'Breadcrumb',
    slug: 'breadcrumb',
    title: 'Breadcrumb',
  },
  button: {
    component: dynamic(() => import('@/app/(app)/components/_components/button-demo').then((mod) => mod.ButtonDemo)),
    description: 'Button',
    slug: 'button',
    title: 'Button',
  },
  calendar: {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/calendar-demo').then((mod) => mod.CalendarDemo),
    ),
    description: 'Calendar',
    slug: 'calendar',
    title: 'Calendar',
  },
  card: {
    component: dynamic(() => import('@/app/(app)/components/_components/card-demo').then((mod) => mod.CardDemo)),
    description: 'Card',
    slug: 'card',
    title: 'Card',
  },
  carousel: {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/carousel-demo').then((mod) => mod.CarouselDemo),
    ),
    description: 'Carousel',
    slug: 'carousel',
    title: 'Carousel',
  },
  chart: {
    component: dynamic(() => import('@/app/(app)/components/_components/chart-demo').then((mod) => mod.ChartDemo)),
    description: 'Chart',
    slug: 'chart',
    title: 'Chart',
  },
  'checkbox-cards': {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/checkbox-cards-demo').then((mod) => mod.CheckboxCardsDemo),
    ),
    description: 'Checkbox Cards',
    slug: 'checkbox-cards',
    title: 'Checkbox Cards',
  },
  checkbox: {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/checkbox-demo').then((mod) => mod.CheckboxDemo),
    ),
    description: 'Checkbox',
    slug: 'checkbox',
    title: 'Checkbox',
  },
  'checkbox-group': {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/checkbox-group-demo').then((mod) => mod.CheckboxGroupDemo),
    ),
    description: 'Checkbox Group',
    slug: 'checkbox-group',
    title: 'Checkbox Group',
  },
  collapsible: {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/collapsible-demo').then((mod) => mod.CollapsibleDemo),
    ),
    description: 'Collapsible',
    slug: 'collapsible',
    title: 'Collapsible',
  },
  combobox: {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/combobox-demo').then((mod) => mod.ComboboxDemo),
    ),
    description: 'Combobox',
    slug: 'combobox',
    title: 'Combobox',
  },
  command: {
    component: dynamic(() => import('@/app/(app)/components/_components/command-demo').then((mod) => mod.CommandDemo)),
    description: 'Command',
    slug: 'command',
    title: 'Command',
  },
  'context-menu': {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/context-menu-demo').then((mod) => mod.ContextMenuDemo),
    ),
    description: 'Context Menu',
    slug: 'context-menu',
    title: 'Context Menu',
  },
  'date-picker': {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/date-picker-demo').then((mod) => mod.DatePickerDemo),
    ),
    description: 'Date Picker',
    slug: 'date-picker',
    title: 'Date Picker',
  },
  dialog: {
    component: dynamic(() => import('@/app/(app)/components/_components/dialog-demo').then((mod) => mod.DialogDemo)),
    description: 'Dialog',
    slug: 'dialog',
    title: 'Dialog',
  },
  drawer: {
    component: dynamic(() => import('@/app/(app)/components/_components/drawer-demo').then((mod) => mod.DrawerDemo)),
    description: 'Drawer',
    slug: 'drawer',
    title: 'Drawer',
  },
  'dropdown-menu': {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/dropdown-menu-demo').then((mod) => mod.DropdownMenuDemo),
    ),
    description: 'Dropdown Menu',
    slug: 'dropdown-menu',
    title: 'Dropdown Menu',
  },
  form: {
    component: dynamic(() => import('@/app/(app)/components/_components/form-demo').then((mod) => mod.FormDemo)),
    description: 'Form',
    slug: 'form',
    title: 'Form',
  },
  'hover-card': {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/hover-card-demo').then((mod) => mod.HoverCardDemo),
    ),
    description: 'Hover Card',
    slug: 'hover-card',
    title: 'Hover Card',
  },
  'input-date': {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/input-date-demo').then((mod) => mod.InputDateDemo),
    ),
    description: 'Input Date',
    slug: 'input-date',
    title: 'Input Date',
  },
  input: {
    component: dynamic(() => import('@/app/(app)/components/_components/input-demo').then((mod) => mod.InputDemo)),
    description: 'Input',
    slug: 'input',
    title: 'Input',
  },
  'input-number': {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/input-number-demo').then((mod) => mod.InputNumberDemo),
    ),
    description: 'Input Number',
    slug: 'input-number',
    title: 'Input Number',
  },
  'input-otp': {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/input-otp-demo').then((mod) => mod.InputOTPDemo),
    ),
    description: 'Input OTP',
    slug: 'input-otp',
    title: 'Input OTP',
  },
  'input-password': {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/input-password-demo').then((mod) => mod.InputPasswordDemo),
    ),
    description: 'Input Password',
    slug: 'input-password',
    title: 'Input Password',
  },
  'input-search': {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/input-search-demo').then((mod) => mod.InputSearchDemo),
    ),
    description: 'Input Search',
    slug: 'input-search',
    title: 'Input Search',
  },
  'input-time': {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/input-time-demo').then((mod) => mod.InputTimeDemo),
    ),
    description: 'Input Time',
    slug: 'input-time',
    title: 'Input Time',
  },
  kbd: {
    component: dynamic(() => import('@/app/(app)/components/_components/kbd-demo').then((mod) => mod.KbdDemo)),
    description: 'Kbd',
    slug: 'kbd',
    title: 'Kbd',
  },
  label: {
    component: dynamic(() => import('@/app/(app)/components/_components/label-demo').then((mod) => mod.LabelDemo)),
    description: 'Label',
    slug: 'label',
    title: 'Label',
  },
  menubar: {
    component: dynamic(() => import('@/app/(app)/components/_components/menubar-demo').then((mod) => mod.MenubarDemo)),
    description: 'Menubar',
    slug: 'menubar',
    title: 'Menubar',
  },
  'navigation-menu': {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/navigation-menu-demo').then((mod) => mod.NavigationMenuDemo),
    ),
    description: 'Navigation Menu',
    slug: 'navigation-menu',
    title: 'Navigation Menu',
  },
  pagination: {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/pagination-demo').then((mod) => mod.PaginationDemo),
    ),
    description: 'Pagination',
    slug: 'pagination',
    title: 'Pagination',
  },
  popover: {
    component: dynamic(() => import('@/app/(app)/components/_components/popover-demo').then((mod) => mod.PopoverDemo)),
    description: 'Popover',
    slug: 'popover',
    title: 'Popover',
  },
  progress: {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/progress-demo').then((mod) => mod.ProgressDemo),
    ),
    description: 'Progress',
    slug: 'progress',
    title: 'Progress',
  },
  'progress-circle': {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/progress-circle-demo').then((mod) => mod.ProgressCircleDemo),
    ),
    description: 'Progress Circle',
    slug: 'progress-circle',
    title: 'Progress Circle',
  },
  'radio-cards': {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/radio-cards-demo').then((mod) => mod.RadioCardsDemo),
    ),
    description: 'Radio Cards',
    slug: 'radio-cards',
    title: 'Radio Cards',
  },
  radio: {
    component: dynamic(() => import('@/app/(app)/components/_components/radio-demo').then((mod) => mod.RadioDemo)),
    description: 'Radio',
    slug: 'radio',
    title: 'Radio',
  },
  'radio-group': {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/radio-group-demo').then((mod) => mod.RadioGroupDemo),
    ),
    description: 'Radio Group',
    slug: 'radio-group',
    title: 'Radio Group',
  },
  resizable: {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/resizable-demo').then((mod) => mod.ResizableDemo),
    ),
    description: 'Resizable',
    slug: 'resizable',
    title: 'Resizable',
  },
  'scroll-area': {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/scroll-area-demo').then((mod) => mod.ScrollAreaDemo),
    ),
    description: 'Scroll Area',
    slug: 'scroll-area',
    title: 'Scroll Area',
  },
  select: {
    component: dynamic(() => import('@/app/(app)/components/_components/select-demo').then((mod) => mod.SelectDemo)),
    description: 'Select',
    slug: 'select',
    title: 'Select',
  },
  separator: {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/separator-demo').then((mod) => mod.SeparatorDemo),
    ),
    description: 'Separator',
    slug: 'separator',
    title: 'Separator',
  },
  sheet: {
    component: dynamic(() => import('@/app/(app)/components/_components/sheet-demo').then((mod) => mod.SheetDemo)),
    description: 'Sheet',
    slug: 'sheet',
    title: 'Sheet',
  },
  skeleton: {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/skeleton-demo').then((mod) => mod.SkeletonDemo),
    ),
    description: 'Skeleton',
    slug: 'skeleton',
    title: 'Skeleton',
  },
  slider: {
    component: dynamic(() => import('@/app/(app)/components/_components/slider-demo').then((mod) => mod.SliderDemo)),
    description: 'Slider',
    slug: 'slider',
    title: 'Slider',
  },
  sonner: {
    component: dynamic(() => import('@/app/(app)/components/_components/sonner-demo').then((mod) => mod.SonnerDemo)),
    description: 'Sonner',
    slug: 'sonner',
    title: 'Sonner',
  },
  switch: {
    component: dynamic(() => import('@/app/(app)/components/_components/switch-demo').then((mod) => mod.SwitchDemo)),
    description: 'Switch',
    slug: 'switch',
    title: 'Switch',
  },
  table: {
    component: dynamic(() => import('@/app/(app)/components/_components/table-demo').then((mod) => mod.TableDemo)),
    description: 'Table',
    slug: 'table',
    title: 'Table',
  },
  tabs: {
    component: dynamic(() => import('@/app/(app)/components/_components/tabs-demo').then((mod) => mod.TabsDemo)),
    description: 'Tabs',
    slug: 'tabs',
    title: 'Tabs',
  },
  textarea: {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/textarea-demo').then((mod) => mod.TextareaDemo),
    ),
    description: 'Textarea',
    slug: 'textarea',
    title: 'Textarea',
  },
  toggle: {
    component: dynamic(() => import('@/app/(app)/components/_components/toggle-demo').then((mod) => mod.ToggleDemo)),
    description: 'Toggle',
    slug: 'toggle',
    title: 'Toggle',
  },
  'toggle-group': {
    component: dynamic(() =>
      import('@/app/(app)/components/_components/toggle-group-demo').then((mod) => mod.ToggleGroupDemo),
    ),
    description: 'Toggle Group',
    slug: 'toggle-group',
    title: 'Toggle Group',
  },
  tooltip: {
    component: dynamic(() => import('@/app/(app)/components/_components/tooltip-demo').then((mod) => mod.TooltipDemo)),
    description: 'Tooltip',
    slug: 'tooltip',
    title: 'Tooltip',
  },
};

export const registryComponentGroups: RegistryGroup[] = [
  {
    title: 'All Components',
    slug: '',
  },
  {
    components: [
      registryComponents.accordion,
      registryComponents.card,
      registryComponents.carousel,
      registryComponents.collapsible,
      registryComponents['aspect-ratio'],
      registryComponents.resizable,
      registryComponents['scroll-area'],
      registryComponents.separator,
      registryComponents.skeleton,
    ],
    description: 'Container and Layout components',
    title: 'Container & Layout',
  },
  {
    components: [
      registryComponents.breadcrumb,
      registryComponents.menubar,
      registryComponents['navigation-menu'],
      registryComponents.tabs,
      registryComponents['context-menu'],
      registryComponents['dropdown-menu'],
      registryComponents.command,
    ],
    description: 'Navigation & Menu components',
    title: 'Navigation & Menu',
  },
  {
    components: [
      registryComponents['alert-dialog'],
      registryComponents.dialog,
      registryComponents.drawer,
      registryComponents.sheet,
      registryComponents.popover,
      registryComponents.tooltip,
      registryComponents['hover-card'],
    ],
    description: 'Overlay, Dialog & Popups components',
    title: 'Overlay & Dialog',
  },
  {
    components: [
      registryComponents.form,
      registryComponents.button,
      registryComponents.input,
      registryComponents['input-date'],
      registryComponents['input-number'],
      registryComponents['input-otp'],
      registryComponents['input-password'],
      registryComponents['input-search'],
      registryComponents['input-time'],
      registryComponents['date-picker'],
      registryComponents.calendar,
      registryComponents.checkbox,
      registryComponents['checkbox-group'],
      registryComponents['checkbox-cards'],
      registryComponents.radio,
      registryComponents['radio-group'],
      registryComponents['radio-cards'],
      registryComponents.switch,
      registryComponents.toggle,
      registryComponents['toggle-group'],
      registryComponents.textarea,
      registryComponents.combobox,
      registryComponents.select,
      registryComponents.label,
      registryComponents.slider,
    ],
    description: 'Input & Form Components',
    title: 'Forms & Input',
  },
  {
    components: [
      registryComponents.alert,
      registryComponents.avatar,
      registryComponents.badge,
      registryComponents.progress,
      registryComponents['progress-circle'],
      registryComponents.sonner,
      registryComponents.chart,
      registryComponents.table,
      registryComponents.pagination,
    ],
    description: 'Response, Notification & Data Display components',
    title: 'Feedback & Data Display',
  },
  {
    components: [registryComponents.kbd],
    description: 'Utilities & Auxiliary Components',
    title: 'Utilities',
  },
];
