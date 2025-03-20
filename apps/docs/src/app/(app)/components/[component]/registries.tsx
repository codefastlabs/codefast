import type { ComponentType } from 'react';

import dynamic from 'next/dynamic';

const Accordion = dynamic(() => import('@/registry/demos/accordion-demo').then((mod) => mod.AccordionDemo));
const Alert = dynamic(() => import('@/registry/demos/alert-demo').then((mod) => mod.AlertDemo));
const AlertDialog = dynamic(() => import('@/registry/demos/alert-dialog-demo').then((mod) => mod.AlertDialogDemo));
const AspectRatio = dynamic(() => import('@/registry/demos/aspect-ratio-demo').then((mod) => mod.AspectRatioDemo));
const Avatar = dynamic(() => import('@/registry/demos/avatar-demo').then((mod) => mod.AvatarDemo));
const Badge = dynamic(() => import('@/registry/demos/badge-demo').then((mod) => mod.BadgeDemo));
const Breadcrumb = dynamic(() => import('@/registry/demos/breadcrumb-demo').then((mod) => mod.BreadcrumbDemo));
const Button = dynamic(() => import('@/registry/demos/button-demo').then((mod) => mod.ButtonDemo));
const Calendar = dynamic(() => import('@/registry/demos/calendar-demo').then((mod) => mod.CalendarDemo));
const Card = dynamic(() => import('@/registry/demos/card-demo').then((mod) => mod.CardDemo));
const Carousel = dynamic(() => import('@/registry/demos/carousel-demo').then((mod) => mod.CarouselDemo));
const Chart = dynamic(() => import('@/registry/demos/chart-demo').then((mod) => mod.ChartDemo));
const CheckboxCards = dynamic(() =>
  import('@/registry/demos/checkbox-cards-demo').then((mod) => mod.CheckboxCardsDemo),
);
const Checkbox = dynamic(() => import('@/registry/demos/checkbox-demo').then((mod) => mod.CheckboxDemo));
const CheckboxGroup = dynamic(() =>
  import('@/registry/demos/checkbox-group-demo').then((mod) => mod.CheckboxGroupDemo),
);
const Collapsible = dynamic(() => import('@/registry/demos/collapsible-demo').then((mod) => mod.CollapsibleDemo));
const Combobox = dynamic(() => import('@/registry/demos/combobox-demo').then((mod) => mod.ComboboxDemo));
const Command = dynamic(() => import('@/registry/demos/command-demo').then((mod) => mod.CommandDemo));
const ContextMenu = dynamic(() => import('@/registry/demos/context-menu-demo').then((mod) => mod.ContextMenuDemo));
const DatePicker = dynamic(() => import('@/registry/demos/date-picker-demo').then((mod) => mod.DatePickerDemo));
const Dialog = dynamic(() => import('@/registry/demos/dialog-demo').then((mod) => mod.DialogDemo));
const Drawer = dynamic(() => import('@/registry/demos/drawer-demo').then((mod) => mod.DrawerDemo));
const DropdownMenu = dynamic(() => import('@/registry/demos/dropdown-menu-demo').then((mod) => mod.DropdownMenuDemo));
const Form = dynamic(() => import('@/registry/demos/form-demo').then((mod) => mod.FormDemo));
const HoverCard = dynamic(() => import('@/registry/demos/hover-card-demo').then((mod) => mod.HoverCardDemo));
const InputDate = dynamic(() => import('@/registry/demos/input-date-demo').then((mod) => mod.InputDateDemo));
const Input = dynamic(() => import('@/registry/demos/input-demo').then((mod) => mod.InputDemo));
const InputNumber = dynamic(() => import('@/registry/demos/input-number-demo').then((mod) => mod.InputNumberDemo));
const InputOTP = dynamic(() => import('@/registry/demos/input-otp-demo').then((mod) => mod.InputOTPDemo));
const InputPassword = dynamic(() =>
  import('@/registry/demos/input-password-demo').then((mod) => mod.InputPasswordDemo),
);
const InputSearch = dynamic(() => import('@/registry/demos/input-search-demo').then((mod) => mod.InputSearchDemo));
const InputTime = dynamic(() => import('@/registry/demos/input-time-demo').then((mod) => mod.InputTimeDemo));
const Kbd = dynamic(() => import('@/registry/demos/kbd-demo').then((mod) => mod.KbdDemo));
const Label = dynamic(() => import('@/registry/demos/label-demo').then((mod) => mod.LabelDemo));
const Menubar = dynamic(() => import('@/registry/demos/menubar-demo').then((mod) => mod.MenubarDemo));
const NavigationMenu = dynamic(() =>
  import('@/registry/demos/navigation-menu-demo').then((mod) => mod.NavigationMenuDemo),
);
const Pagination = dynamic(() => import('@/registry/demos/pagination-demo').then((mod) => mod.PaginationDemo));
const Popover = dynamic(() => import('@/registry/demos/popover-demo').then((mod) => mod.PopoverDemo));
const Progress = dynamic(() => import('@/registry/demos/progress-demo').then((mod) => mod.ProgressDemo));
const RadioCards = dynamic(() => import('@/registry/demos/radio-cards-demo').then((mod) => mod.RadioCardsDemo));
const Radio = dynamic(() => import('@/registry/demos/radio-demo').then((mod) => mod.RadioDemo));
const RadioGroup = dynamic(() => import('@/registry/demos/radio-group-demo').then((mod) => mod.RadioGroupDemo));
const Resizable = dynamic(() => import('@/registry/demos/resizable-demo').then((mod) => mod.ResizableDemo));
const ScrollArea = dynamic(() => import('@/registry/demos/scroll-area-demo').then((mod) => mod.ScrollAreaDemo));
const Select = dynamic(() => import('@/registry/demos/select-demo').then((mod) => mod.SelectDemo));
const Separator = dynamic(() => import('@/registry/demos/separator-demo').then((mod) => mod.SeparatorDemo));
const Sheet = dynamic(() => import('@/registry/demos/sheet-demo').then((mod) => mod.SheetDemo));
const Skeleton = dynamic(() => import('@/registry/demos/skeleton-demo').then((mod) => mod.SkeletonDemo));
const Slider = dynamic(() => import('@/registry/demos/slider-demo').then((mod) => mod.SliderDemo));
const Sonner = dynamic(() => import('@/registry/demos/sonner-demo').then((mod) => mod.SonnerDemo));
const Switch = dynamic(() => import('@/registry/demos/switch-demo').then((mod) => mod.SwitchDemo));
const Table = dynamic(() => import('@/registry/demos/table-demo').then((mod) => mod.TableDemo));
const Tabs = dynamic(() => import('@/registry/demos/tabs-demo').then((mod) => mod.TabsDemo));
const Textarea = dynamic(() => import('@/registry/demos/textarea-demo').then((mod) => mod.TextareaDemo));
const Toggle = dynamic(() => import('@/registry/demos/toggle-demo').then((mod) => mod.ToggleDemo));
const ToggleGroup = dynamic(() => import('@/registry/demos/toggle-group-demo').then((mod) => mod.ToggleGroupDemo));
const Tooltip = dynamic(() => import('@/registry/demos/tooltip-demo').then((mod) => mod.TooltipDemo));

export interface Registry {
  component: ComponentType;
  description: string;
  title: string;
}

export const registries: Record<string, Registry> = {
  accordion: {
    component: Accordion,
    description: 'Accordion',
    title: 'Accordion',
  },
  alert: {
    component: Alert,
    description: 'Alert',
    title: 'Alert',
  },
  'alert-dialog': {
    component: AlertDialog,
    description: 'Alert Dialog',
    title: 'Alert Dialog',
  },
  'aspect-ratio': {
    component: AspectRatio,
    description: 'Aspect Ratio',
    title: 'Aspect Ratio',
  },
  avatar: {
    component: Avatar,
    description: 'Avatar',
    title: 'Avatar',
  },
  badge: {
    component: Badge,
    description: 'Badge',
    title: 'Badge',
  },
  breadcrumb: {
    component: Breadcrumb,
    description: 'Breadcrumb',
    title: 'Breadcrumb',
  },
  button: {
    component: Button,
    description: 'Button',
    title: 'Button',
  },
  calendar: {
    component: Calendar,
    description: 'Calendar',
    title: 'Calendar',
  },
  card: {
    component: Card,
    description: 'Card',
    title: 'Card',
  },
  carousel: {
    component: Carousel,
    description: 'Carousel',
    title: 'Carousel',
  },
  chart: {
    component: Chart,
    description: 'Chart',
    title: 'Chart',
  },
  'checkbox-cards': {
    component: CheckboxCards,
    description: 'Checkbox Cards',
    title: 'Checkbox Cards',
  },
  checkbox: {
    component: Checkbox,
    description: 'Checkbox',
    title: 'Checkbox',
  },
  'checkbox-group': {
    component: CheckboxGroup,
    description: 'Checkbox Group',
    title: 'Checkbox Group',
  },
  collapsible: {
    component: Collapsible,
    description: 'Collapsible',
    title: 'Collapsible',
  },
  combobox: {
    component: Combobox,
    description: 'Combobox',
    title: 'Combobox',
  },
  command: {
    component: Command,
    description: 'Command',
    title: 'Command',
  },
  'context-menu': {
    component: ContextMenu,
    description: 'Context Menu',
    title: 'Context Menu',
  },
  'date-picker': {
    component: DatePicker,
    description: 'Date Picker',
    title: 'Date Picker',
  },
  dialog: {
    component: Dialog,
    description: 'Dialog',
    title: 'Dialog',
  },
  drawer: {
    component: Drawer,
    description: 'Drawer',
    title: 'Drawer',
  },
  'dropdown-menu': {
    component: DropdownMenu,
    description: 'Dropdown Menu',
    title: 'Dropdown Menu',
  },
  form: {
    component: Form,
    description: 'Form',
    title: 'Form',
  },
  'hover-card': {
    component: HoverCard,
    description: 'Hover Card',
    title: 'Hover Card',
  },
  'input-date': {
    component: InputDate,
    description: 'Input Date',
    title: 'Input Date',
  },
  input: {
    component: Input,
    description: 'Input',
    title: 'Input',
  },
  'input-number': {
    component: InputNumber,
    description: 'Input Number',
    title: 'Input Number',
  },
  'input-otp': {
    component: InputOTP,
    description: 'Input OTP',
    title: 'Input OTP',
  },
  'input-password': {
    component: InputPassword,
    description: 'Input Password',
    title: 'Input Password',
  },
  'input-search': {
    component: InputSearch,
    description: 'Input Search',
    title: 'Input Search',
  },
  'input-time': {
    component: InputTime,
    description: 'Input Time',
    title: 'Input Time',
  },
  kbd: {
    component: Kbd,
    description: 'Kbd',
    title: 'Kbd',
  },
  label: {
    component: Label,
    description: 'Label',
    title: 'Label',
  },
  menubar: {
    component: Menubar,
    description: 'Menubar',
    title: 'Menubar',
  },
  'navigation-menu': {
    component: NavigationMenu,
    description: 'Navigation Menu',
    title: 'Navigation Menu',
  },
  pagination: {
    component: Pagination,
    description: 'Pagination',
    title: 'Pagination',
  },
  popover: {
    component: Popover,
    description: 'Popover',
    title: 'Popover',
  },
  progress: {
    component: Progress,
    description: 'Progress',
    title: 'Progress',
  },
  'radio-cards': {
    component: RadioCards,
    description: 'Radio Cards',
    title: 'Radio Cards',
  },
  radio: {
    component: Radio,
    description: 'Radio',
    title: 'Radio',
  },
  'radio-group': {
    component: RadioGroup,
    description: 'Radio Group',
    title: 'Radio Group',
  },
  resizable: {
    component: Resizable,
    description: 'Resizable',
    title: 'Resizable',
  },
  'scroll-area': {
    component: ScrollArea,
    description: 'Scroll Area',
    title: 'Scroll Area',
  },
  select: {
    component: Select,
    description: 'Select',
    title: 'Select',
  },
  separator: {
    component: Separator,
    description: 'Separator',
    title: 'Separator',
  },
  sheet: {
    component: Sheet,
    description: 'Sheet',
    title: 'Sheet',
  },
  skeleton: {
    component: Skeleton,
    description: 'Skeleton',
    title: 'Skeleton',
  },
  slider: {
    component: Slider,
    description: 'Slider',
    title: 'Slider',
  },
  sonner: {
    component: Sonner,
    description: 'Sonner',
    title: 'Sonner',
  },
  switch: {
    component: Switch,
    description: 'Switch',
    title: 'Switch',
  },
  table: {
    component: Table,
    description: 'Table',
    title: 'Table',
  },
  tabs: {
    component: Tabs,
    description: 'Tabs',
    title: 'Tabs',
  },
  textarea: {
    component: Textarea,
    description: 'Textarea',
    title: 'Textarea',
  },
  toggle: {
    component: Toggle,
    description: 'Toggle',
    title: 'Toggle',
  },
  'toggle-group': {
    component: ToggleGroup,
    description: 'Toggle Group',
    title: 'Toggle Group',
  },
  tooltip: {
    component: Tooltip,
    description: 'Tooltip',
    title: 'Tooltip',
  },
};
