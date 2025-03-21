import type { ComponentType } from 'react';

import dynamic from 'next/dynamic';

export interface Registry {
  component: ComponentType;
  description: string;
  title: string;
}

export const registries: Record<string, Registry> = {
  accordion: {
    component: dynamic(() => import('@/registry/demos/accordion-demo').then((mod) => mod.AccordionDemo)),
    description: 'Accordion',
    title: 'Accordion',
  },
  alert: {
    component: dynamic(() => import('@/registry/demos/alert-demo').then((mod) => mod.AlertDemo)),
    description: 'Alert',
    title: 'Alert',
  },
  'alert-dialog': {
    component: dynamic(() => import('@/registry/demos/alert-dialog-demo').then((mod) => mod.AlertDialogDemo)),
    description: 'Alert Dialog',
    title: 'Alert Dialog',
  },
  'aspect-ratio': {
    component: dynamic(() => import('@/registry/demos/aspect-ratio-demo').then((mod) => mod.AspectRatioDemo)),
    description: 'Aspect Ratio',
    title: 'Aspect Ratio',
  },
  avatar: {
    component: dynamic(() => import('@/registry/demos/avatar-demo').then((mod) => mod.AvatarDemo)),
    description: 'Avatar',
    title: 'Avatar',
  },
  badge: {
    component: dynamic(() => import('@/registry/demos/badge-demo').then((mod) => mod.BadgeDemo)),
    description: 'Badge',
    title: 'Badge',
  },
  breadcrumb: {
    component: dynamic(() => import('@/registry/demos/breadcrumb-demo').then((mod) => mod.BreadcrumbDemo)),
    description: 'Breadcrumb',
    title: 'Breadcrumb',
  },
  button: {
    component: dynamic(() => import('@/registry/demos/button-demo').then((mod) => mod.ButtonDemo)),
    description: 'Button',
    title: 'Button',
  },
  calendar: {
    component: dynamic(() => import('@/registry/demos/calendar-demo').then((mod) => mod.CalendarDemo)),
    description: 'Calendar',
    title: 'Calendar',
  },
  card: {
    component: dynamic(() => import('@/registry/demos/card-demo').then((mod) => mod.CardDemo)),
    description: 'Card',
    title: 'Card',
  },
  carousel: {
    component: dynamic(() => import('@/registry/demos/carousel-demo').then((mod) => mod.CarouselDemo)),
    description: 'Carousel',
    title: 'Carousel',
  },
  chart: {
    component: dynamic(() => import('@/registry/demos/chart-demo').then((mod) => mod.ChartDemo)),
    description: 'Chart',
    title: 'Chart',
  },
  'checkbox-cards': {
    component: dynamic(() => import('@/registry/demos/checkbox-cards-demo').then((mod) => mod.CheckboxCardsDemo)),
    description: 'Checkbox Cards',
    title: 'Checkbox Cards',
  },
  checkbox: {
    component: dynamic(() => import('@/registry/demos/checkbox-demo').then((mod) => mod.CheckboxDemo)),
    description: 'Checkbox',
    title: 'Checkbox',
  },
  'checkbox-group': {
    component: dynamic(() => import('@/registry/demos/checkbox-group-demo').then((mod) => mod.CheckboxGroupDemo)),
    description: 'Checkbox Group',
    title: 'Checkbox Group',
  },
  collapsible: {
    component: dynamic(() => import('@/registry/demos/collapsible-demo').then((mod) => mod.CollapsibleDemo)),
    description: 'Collapsible',
    title: 'Collapsible',
  },
  combobox: {
    component: dynamic(() => import('@/registry/demos/combobox-demo').then((mod) => mod.ComboboxDemo)),
    description: 'Combobox',
    title: 'Combobox',
  },
  command: {
    component: dynamic(() => import('@/registry/demos/command-demo').then((mod) => mod.CommandDemo)),
    description: 'Command',
    title: 'Command',
  },
  'context-menu': {
    component: dynamic(() => import('@/registry/demos/context-menu-demo').then((mod) => mod.ContextMenuDemo)),
    description: 'Context Menu',
    title: 'Context Menu',
  },
  'date-picker': {
    component: dynamic(() => import('@/registry/demos/date-picker-demo').then((mod) => mod.DatePickerDemo)),
    description: 'Date Picker',
    title: 'Date Picker',
  },
  dialog: {
    component: dynamic(() => import('@/registry/demos/dialog-demo').then((mod) => mod.DialogDemo)),
    description: 'Dialog',
    title: 'Dialog',
  },
  drawer: {
    component: dynamic(() => import('@/registry/demos/drawer-demo').then((mod) => mod.DrawerDemo)),
    description: 'Drawer',
    title: 'Drawer',
  },
  'dropdown-menu': {
    component: dynamic(() => import('@/registry/demos/dropdown-menu-demo').then((mod) => mod.DropdownMenuDemo)),
    description: 'Dropdown Menu',
    title: 'Dropdown Menu',
  },
  form: {
    component: dynamic(() => import('@/registry/demos/form-demo').then((mod) => mod.FormDemo)),
    description: 'Form',
    title: 'Form',
  },
  'hover-card': {
    component: dynamic(() => import('@/registry/demos/hover-card-demo').then((mod) => mod.HoverCardDemo)),
    description: 'Hover Card',
    title: 'Hover Card',
  },
  'input-date': {
    component: dynamic(() => import('@/registry/demos/input-date-demo').then((mod) => mod.InputDateDemo)),
    description: 'Input Date',
    title: 'Input Date',
  },
  input: {
    component: dynamic(() => import('@/registry/demos/input-demo').then((mod) => mod.InputDemo)),
    description: 'Input',
    title: 'Input',
  },
  'input-number': {
    component: dynamic(() => import('@/registry/demos/input-number-demo').then((mod) => mod.InputNumberDemo)),
    description: 'Input Number',
    title: 'Input Number',
  },
  'input-otp': {
    component: dynamic(() => import('@/registry/demos/input-otp-demo').then((mod) => mod.InputOTPDemo)),
    description: 'Input OTP',
    title: 'Input OTP',
  },
  'input-password': {
    component: dynamic(() => import('@/registry/demos/input-password-demo').then((mod) => mod.InputPasswordDemo)),
    description: 'Input Password',
    title: 'Input Password',
  },
  'input-search': {
    component: dynamic(() => import('@/registry/demos/input-search-demo').then((mod) => mod.InputSearchDemo)),
    description: 'Input Search',
    title: 'Input Search',
  },
  'input-time': {
    component: dynamic(() => import('@/registry/demos/input-time-demo').then((mod) => mod.InputTimeDemo)),
    description: 'Input Time',
    title: 'Input Time',
  },
  kbd: {
    component: dynamic(() => import('@/registry/demos/kbd-demo').then((mod) => mod.KbdDemo)),
    description: 'Kbd',
    title: 'Kbd',
  },
  label: {
    component: dynamic(() => import('@/registry/demos/label-demo').then((mod) => mod.LabelDemo)),
    description: 'Label',
    title: 'Label',
  },
  menubar: {
    component: dynamic(() => import('@/registry/demos/menubar-demo').then((mod) => mod.MenubarDemo)),
    description: 'Menubar',
    title: 'Menubar',
  },
  'navigation-menu': {
    component: dynamic(() => import('@/registry/demos/navigation-menu-demo').then((mod) => mod.NavigationMenuDemo)),
    description: 'Navigation Menu',
    title: 'Navigation Menu',
  },
  pagination: {
    component: dynamic(() => import('@/registry/demos/pagination-demo').then((mod) => mod.PaginationDemo)),
    description: 'Pagination',
    title: 'Pagination',
  },
  popover: {
    component: dynamic(() => import('@/registry/demos/popover-demo').then((mod) => mod.PopoverDemo)),
    description: 'Popover',
    title: 'Popover',
  },
  progress: {
    component: dynamic(() => import('@/registry/demos/progress-demo').then((mod) => mod.ProgressDemo)),
    description: 'Progress',
    title: 'Progress',
  },
  'radio-cards': {
    component: dynamic(() => import('@/registry/demos/radio-cards-demo').then((mod) => mod.RadioCardsDemo)),
    description: 'Radio Cards',
    title: 'Radio Cards',
  },
  radio: {
    component: dynamic(() => import('@/registry/demos/radio-demo').then((mod) => mod.RadioDemo)),
    description: 'Radio',
    title: 'Radio',
  },
  'radio-group': {
    component: dynamic(() => import('@/registry/demos/radio-group-demo').then((mod) => mod.RadioGroupDemo)),
    description: 'Radio Group',
    title: 'Radio Group',
  },
  resizable: {
    component: dynamic(() => import('@/registry/demos/resizable-demo').then((mod) => mod.ResizableDemo)),
    description: 'Resizable',
    title: 'Resizable',
  },
  'scroll-area': {
    component: dynamic(() => import('@/registry/demos/scroll-area-demo').then((mod) => mod.ScrollAreaDemo)),
    description: 'Scroll Area',
    title: 'Scroll Area',
  },
  select: {
    component: dynamic(() => import('@/registry/demos/select-demo').then((mod) => mod.SelectDemo)),
    description: 'Select',
    title: 'Select',
  },
  separator: {
    component: dynamic(() => import('@/registry/demos/separator-demo').then((mod) => mod.SeparatorDemo)),
    description: 'Separator',
    title: 'Separator',
  },
  sheet: {
    component: dynamic(() => import('@/registry/demos/sheet-demo').then((mod) => mod.SheetDemo)),
    description: 'Sheet',
    title: 'Sheet',
  },
  skeleton: {
    component: dynamic(() => import('@/registry/demos/skeleton-demo').then((mod) => mod.SkeletonDemo)),
    description: 'Skeleton',
    title: 'Skeleton',
  },
  slider: {
    component: dynamic(() => import('@/registry/demos/slider-demo').then((mod) => mod.SliderDemo)),
    description: 'Slider',
    title: 'Slider',
  },
  sonner: {
    component: dynamic(() => import('@/registry/demos/sonner-demo').then((mod) => mod.SonnerDemo)),
    description: 'Sonner',
    title: 'Sonner',
  },
  switch: {
    component: dynamic(() => import('@/registry/demos/switch-demo').then((mod) => mod.SwitchDemo)),
    description: 'Switch',
    title: 'Switch',
  },
  table: {
    component: dynamic(() => import('@/registry/demos/table-demo').then((mod) => mod.TableDemo)),
    description: 'Table',
    title: 'Table',
  },
  tabs: {
    component: dynamic(() => import('@/registry/demos/tabs-demo').then((mod) => mod.TabsDemo)),
    description: 'Tabs',
    title: 'Tabs',
  },
  textarea: {
    component: dynamic(() => import('@/registry/demos/textarea-demo').then((mod) => mod.TextareaDemo)),
    description: 'Textarea',
    title: 'Textarea',
  },
  toggle: {
    component: dynamic(() => import('@/registry/demos/toggle-demo').then((mod) => mod.ToggleDemo)),
    description: 'Toggle',
    title: 'Toggle',
  },
  'toggle-group': {
    component: dynamic(() => import('@/registry/demos/toggle-group-demo').then((mod) => mod.ToggleGroupDemo)),
    description: 'Toggle Group',
    title: 'Toggle Group',
  },
  tooltip: {
    component: dynamic(() => import('@/registry/demos/tooltip-demo').then((mod) => mod.TooltipDemo)),
    description: 'Tooltip',
    title: 'Tooltip',
  },
};
