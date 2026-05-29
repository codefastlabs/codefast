/**
 * Heavy demo registry: maps each component slug to its live demo component and
 * its raw source string. This module eagerly imports every demo (recharts, embla,
 * react-day-picker, …) so it must ONLY be imported by the /components route —
 * never by metadata consumers like the home page or the header ⌘K palette.
 *
 * Slugs and metadata (name, category, description) live in `src/data/components.ts`.
 */
import type { ComponentType } from "react";

// — Demo components —
import { AlertDemo } from "#/components/examples/display/alert-demo";
import { AspectRatioDemo } from "#/components/examples/display/aspect-ratio-demo";
import { AvatarDemo } from "#/components/examples/display/avatar-demo";
import { BadgeDemo } from "#/components/examples/display/badge-demo";
import { CarouselDemo } from "#/components/examples/display/carousel-demo";
import { ChartDemo } from "#/components/examples/display/chart-demo";
import { EmptyDemo } from "#/components/examples/display/empty-demo";
import { ItemDemo } from "#/components/examples/display/item-demo";
import { KbdDemo } from "#/components/examples/display/kbd-demo";
import { SpinnerDemo } from "#/components/examples/display/spinner-demo";
import { TableDemo } from "#/components/examples/display/table-demo";
import { AlertDialogDemo } from "#/components/examples/feedback/alert-dialog-demo";
import { ProgressDemo } from "#/components/examples/feedback/progress-demo";
import { ProgressCircleDemo } from "#/components/examples/feedback/progress-circle-demo";
import { SkeletonDemo } from "#/components/examples/feedback/skeleton-demo";
import { SonnerDemo } from "#/components/examples/feedback/sonner-demo";
import { ButtonDemo } from "#/components/examples/form/button-demo";
import { ButtonGroupDemo } from "#/components/examples/form/button-group-demo";
import { CalendarDemo } from "#/components/examples/form/calendar-demo";
import { CheckboxDemo } from "#/components/examples/form/checkbox-demo";
import { CheckboxCardsDemo } from "#/components/examples/form/checkbox-cards-demo";
import { CheckboxGroupDemo } from "#/components/examples/form/checkbox-group-demo";
import { FieldDemo } from "#/components/examples/form/field-demo";
import { FormDemo } from "#/components/examples/form/form-demo";
import { InputDemo } from "#/components/examples/form/input-demo";
import { InputGroupDemo } from "#/components/examples/form/input-group-demo";
import { InputNumberDemo } from "#/components/examples/form/input-number-demo";
import { InputOTPDemo } from "#/components/examples/form/input-otp-demo";
import { InputPasswordDemo } from "#/components/examples/form/input-password-demo";
import { InputSearchDemo } from "#/components/examples/form/input-search-demo";
import { LabelDemo } from "#/components/examples/form/label-demo";
import { NativeSelectDemo } from "#/components/examples/form/native-select-demo";
import { RadioDemo } from "#/components/examples/form/radio-demo";
import { RadioCardsDemo } from "#/components/examples/form/radio-cards-demo";
import { RadioGroupDemo } from "#/components/examples/form/radio-group-demo";
import { SelectDemo } from "#/components/examples/form/select-demo";
import { SliderDemo } from "#/components/examples/form/slider-demo";
import { SwitchDemo } from "#/components/examples/form/switch-demo";
import { TextareaDemo } from "#/components/examples/form/textarea-demo";
import { ToggleDemo } from "#/components/examples/form/toggle-demo";
import { ToggleGroupDemo } from "#/components/examples/form/toggle-group-demo";
import { AccordionDemo } from "#/components/examples/layout/accordion-demo";
import { CardDemo } from "#/components/examples/layout/card-demo";
import { CollapsibleDemo } from "#/components/examples/layout/collapsible-demo";
import { ResizableDemo } from "#/components/examples/layout/resizable-demo";
import { ScrollAreaDemo } from "#/components/examples/layout/scroll-area-demo";
import { SeparatorDemo } from "#/components/examples/layout/separator-demo";
import { BreadcrumbDemo } from "#/components/examples/navigation/breadcrumb-demo";
import { MenubarDemo } from "#/components/examples/navigation/menubar-demo";
import { NavigationMenuDemo } from "#/components/examples/navigation/navigation-menu-demo";
import { PaginationDemo } from "#/components/examples/navigation/pagination-demo";
import { TabsDemo } from "#/components/examples/navigation/tabs-demo";
import { CommandDemo } from "#/components/examples/overlay/command-demo";
import { ContextMenuDemo } from "#/components/examples/overlay/context-menu-demo";
import { DialogDemo } from "#/components/examples/overlay/dialog-demo";
import { DrawerDemo } from "#/components/examples/overlay/drawer-demo";
import { DropdownMenuDemo } from "#/components/examples/overlay/dropdown-menu-demo";
import { HoverCardDemo } from "#/components/examples/overlay/hover-card-demo";
import { PopoverDemo } from "#/components/examples/overlay/popover-demo";
import { SheetDemo } from "#/components/examples/overlay/sheet-demo";
import { TooltipDemo } from "#/components/examples/overlay/tooltip-demo";

// — Raw source strings (single barrel, ?raw resolved by Vite at build time) —
import {
  accordionDemoCode,
  alertDemoCode,
  alertDialogDemoCode,
  aspectRatioDemoCode,
  avatarDemoCode,
  badgeDemoCode,
  breadcrumbDemoCode,
  buttonDemoCode,
  buttonGroupDemoCode,
  calendarDemoCode,
  cardDemoCode,
  carouselDemoCode,
  chartDemoCode,
  checkboxCardsDemoCode,
  checkboxDemoCode,
  checkboxGroupDemoCode,
  collapsibleDemoCode,
  commandDemoCode,
  contextMenuDemoCode,
  dialogDemoCode,
  drawerDemoCode,
  dropdownMenuDemoCode,
  emptyDemoCode,
  fieldDemoCode,
  formDemoCode,
  hoverCardDemoCode,
  inputDemoCode,
  inputGroupDemoCode,
  inputNumberDemoCode,
  inputOtpDemoCode,
  inputPasswordDemoCode,
  inputSearchDemoCode,
  itemDemoCode,
  kbdDemoCode,
  labelDemoCode,
  menubarDemoCode,
  nativeSelectDemoCode,
  navigationMenuDemoCode,
  paginationDemoCode,
  popoverDemoCode,
  progressCircleDemoCode,
  progressDemoCode,
  radioCardsDemoCode,
  radioDemoCode,
  radioGroupDemoCode,
  resizableDemoCode,
  scrollAreaDemoCode,
  selectDemoCode,
  separatorDemoCode,
  sheetDemoCode,
  skeletonDemoCode,
  sliderDemoCode,
  sonnerDemoCode,
  spinnerDemoCode,
  switchDemoCode,
  tableDemoCode,
  tabsDemoCode,
  textareaDemoCode,
  toggleDemoCode,
  toggleGroupDemoCode,
  tooltipDemoCode,
} from "#/components/examples/codes";

export interface DemoEntry {
  readonly Demo: ComponentType;
  readonly code: string;
}

/** Keyed by the component `slug` from `src/data/components.ts`. */
export const DEMOS: Record<string, DemoEntry> = {
  // Display
  badge: { Demo: BadgeDemo, code: badgeDemoCode },
  alert: { Demo: AlertDemo, code: alertDemoCode },
  avatar: { Demo: AvatarDemo, code: avatarDemoCode },
  spinner: { Demo: SpinnerDemo, code: spinnerDemoCode },
  kbd: { Demo: KbdDemo, code: kbdDemoCode },
  "aspect-ratio": { Demo: AspectRatioDemo, code: aspectRatioDemoCode },
  carousel: { Demo: CarouselDemo, code: carouselDemoCode },
  chart: { Demo: ChartDemo, code: chartDemoCode },
  empty: { Demo: EmptyDemo, code: emptyDemoCode },
  item: { Demo: ItemDemo, code: itemDemoCode },
  table: { Demo: TableDemo, code: tableDemoCode },

  // Form
  button: { Demo: ButtonDemo, code: buttonDemoCode },
  "button-group": { Demo: ButtonGroupDemo, code: buttonGroupDemoCode },
  input: { Demo: InputDemo, code: inputDemoCode },
  "input-group": { Demo: InputGroupDemo, code: inputGroupDemoCode },
  "input-number": { Demo: InputNumberDemo, code: inputNumberDemoCode },
  "input-otp": { Demo: InputOTPDemo, code: inputOtpDemoCode },
  "input-password": { Demo: InputPasswordDemo, code: inputPasswordDemoCode },
  "input-search": { Demo: InputSearchDemo, code: inputSearchDemoCode },
  textarea: { Demo: TextareaDemo, code: textareaDemoCode },
  select: { Demo: SelectDemo, code: selectDemoCode },
  "native-select": { Demo: NativeSelectDemo, code: nativeSelectDemoCode },
  checkbox: { Demo: CheckboxDemo, code: checkboxDemoCode },
  "checkbox-group": { Demo: CheckboxGroupDemo, code: checkboxGroupDemoCode },
  "checkbox-cards": { Demo: CheckboxCardsDemo, code: checkboxCardsDemoCode },
  radio: { Demo: RadioDemo, code: radioDemoCode },
  "radio-group": { Demo: RadioGroupDemo, code: radioGroupDemoCode },
  "radio-cards": { Demo: RadioCardsDemo, code: radioCardsDemoCode },
  switch: { Demo: SwitchDemo, code: switchDemoCode },
  slider: { Demo: SliderDemo, code: sliderDemoCode },
  toggle: { Demo: ToggleDemo, code: toggleDemoCode },
  "toggle-group": { Demo: ToggleGroupDemo, code: toggleGroupDemoCode },
  calendar: { Demo: CalendarDemo, code: calendarDemoCode },
  label: { Demo: LabelDemo, code: labelDemoCode },
  field: { Demo: FieldDemo, code: fieldDemoCode },
  form: { Demo: FormDemo, code: formDemoCode },

  // Navigation
  tabs: { Demo: TabsDemo, code: tabsDemoCode },
  breadcrumb: { Demo: BreadcrumbDemo, code: breadcrumbDemoCode },
  pagination: { Demo: PaginationDemo, code: paginationDemoCode },
  menubar: { Demo: MenubarDemo, code: menubarDemoCode },
  "navigation-menu": { Demo: NavigationMenuDemo, code: navigationMenuDemoCode },

  // Overlay
  dialog: { Demo: DialogDemo, code: dialogDemoCode },
  tooltip: { Demo: TooltipDemo, code: tooltipDemoCode },
  popover: { Demo: PopoverDemo, code: popoverDemoCode },
  "dropdown-menu": { Demo: DropdownMenuDemo, code: dropdownMenuDemoCode },
  "alert-dialog": { Demo: AlertDialogDemo, code: alertDialogDemoCode },
  command: { Demo: CommandDemo, code: commandDemoCode },
  "context-menu": { Demo: ContextMenuDemo, code: contextMenuDemoCode },
  drawer: { Demo: DrawerDemo, code: drawerDemoCode },
  "hover-card": { Demo: HoverCardDemo, code: hoverCardDemoCode },
  sheet: { Demo: SheetDemo, code: sheetDemoCode },

  // Feedback
  progress: { Demo: ProgressDemo, code: progressDemoCode },
  "progress-circle": { Demo: ProgressCircleDemo, code: progressCircleDemoCode },
  skeleton: { Demo: SkeletonDemo, code: skeletonDemoCode },
  sonner: { Demo: SonnerDemo, code: sonnerDemoCode },

  // Layout
  card: { Demo: CardDemo, code: cardDemoCode },
  accordion: { Demo: AccordionDemo, code: accordionDemoCode },
  separator: { Demo: SeparatorDemo, code: separatorDemoCode },
  "scroll-area": { Demo: ScrollAreaDemo, code: scrollAreaDemoCode },
  collapsible: { Demo: CollapsibleDemo, code: collapsibleDemoCode },
  resizable: { Demo: ResizableDemo, code: resizableDemoCode },
};
