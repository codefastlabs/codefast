/**
 * Aggregated rich-documentation registry for the per-component detail page
 * (`/components/$slug`), keyed by the component `slug` from `data/components.ts`.
 *
 * Each component's doc is authored in its own `docs/<slug>/<slug>.doc.ts` module
 * and registered here with a single line. Like `demos.tsx`, this barrel eagerly
 * imports heavy example components, so it must ONLY be imported by the `$slug`
 * route — never by lightweight metadata consumers.
 *
 * Components without an entry fall back to the single card demo from `demos.tsx`,
 * so every detail page still renders.
 *
 * TO ADD A COMPONENT
 * 1. Create `docs/<slug>/` with one file per example, an `anatomy.txt`
 *    skeleton, and a `<slug>.doc.ts`.
 * 2. Register the example sources AND `anatomy.txt` in `../codes.ts` (the single
 *    ?raw barrel) — no source code is ever stored as a string literal.
 * 3. Import the doc below and add it to `COMPONENT_DOCS`.
 */
import type { ComponentDoc } from "#/components/examples/docs/types";
import { accordionDoc } from "#/components/examples/docs/accordion/accordion.doc";
import { alertDialogDoc } from "#/components/examples/docs/alert-dialog/alert-dialog.doc";
import { alertDoc } from "#/components/examples/docs/alert/alert.doc";
import { aspectRatioDoc } from "#/components/examples/docs/aspect-ratio/aspect-ratio.doc";
import { avatarDoc } from "#/components/examples/docs/avatar/avatar.doc";
import { badgeDoc } from "#/components/examples/docs/badge/badge.doc";
import { breadcrumbDoc } from "#/components/examples/docs/breadcrumb/breadcrumb.doc";
import { buttonGroupDoc } from "#/components/examples/docs/button-group/button-group.doc";
import { buttonDoc } from "#/components/examples/docs/button/button.doc";
import { calendarDoc } from "#/components/examples/docs/calendar/calendar.doc";
import { cardDoc } from "#/components/examples/docs/card/card.doc";
import { carouselDoc } from "#/components/examples/docs/carousel/carousel.doc";
import { chartDoc } from "#/components/examples/docs/chart/chart.doc";
import { checkboxCardsDoc } from "#/components/examples/docs/checkbox-cards/checkbox-cards.doc";
import { checkboxGroupDoc } from "#/components/examples/docs/checkbox-group/checkbox-group.doc";
import { checkboxDoc } from "#/components/examples/docs/checkbox/checkbox.doc";
import { collapsibleDoc } from "#/components/examples/docs/collapsible/collapsible.doc";
import { commandDoc } from "#/components/examples/docs/command/command.doc";
import { contextMenuDoc } from "#/components/examples/docs/context-menu/context-menu.doc";
import { dialogDoc } from "#/components/examples/docs/dialog/dialog.doc";
import { drawerDoc } from "#/components/examples/docs/drawer/drawer.doc";
import { dropdownMenuDoc } from "#/components/examples/docs/dropdown-menu/dropdown-menu.doc";
import { emptyDoc } from "#/components/examples/docs/empty/empty.doc";
import { fieldDoc } from "#/components/examples/docs/field/field.doc";
import { formDoc } from "#/components/examples/docs/form/form.doc";
import { hoverCardDoc } from "#/components/examples/docs/hover-card/hover-card.doc";
import { inputNumberDoc } from "#/components/examples/docs/input-number/input-number.doc";
import { inputOtpDoc } from "#/components/examples/docs/input-otp/input-otp.doc";
import { inputPasswordDoc } from "#/components/examples/docs/input-password/input-password.doc";
import { inputSearchDoc } from "#/components/examples/docs/input-search/input-search.doc";
import { inputGroupDoc } from "#/components/examples/docs/input-group/input-group.doc";
import { inputDoc } from "#/components/examples/docs/input/input.doc";
import { itemDoc } from "#/components/examples/docs/item/item.doc";
import { kbdDoc } from "#/components/examples/docs/kbd/kbd.doc";
import { labelDoc } from "#/components/examples/docs/label/label.doc";
import { menubarDoc } from "#/components/examples/docs/menubar/menubar.doc";
import { nativeSelectDoc } from "#/components/examples/docs/native-select/native-select.doc";
import { navigationMenuDoc } from "#/components/examples/docs/navigation-menu/navigation-menu.doc";
import { paginationDoc } from "#/components/examples/docs/pagination/pagination.doc";
import { popoverDoc } from "#/components/examples/docs/popover/popover.doc";
import { progressCircleDoc } from "#/components/examples/docs/progress-circle/progress-circle.doc";
import { progressDoc } from "#/components/examples/docs/progress/progress.doc";
import { radioGroupDoc } from "#/components/examples/docs/radio-group/radio-group.doc";
import { radioDoc } from "#/components/examples/docs/radio/radio.doc";
import { radioCardsDoc } from "#/components/examples/docs/radio-cards/radio-cards.doc";
import { resizableDoc } from "#/components/examples/docs/resizable/resizable.doc";
import { scrollAreaDoc } from "#/components/examples/docs/scroll-area/scroll-area.doc";
import { selectDoc } from "#/components/examples/docs/select/select.doc";
import { separatorDoc } from "#/components/examples/docs/separator/separator.doc";
import { sheetDoc } from "#/components/examples/docs/sheet/sheet.doc";
import { sidebarDoc } from "#/components/examples/docs/sidebar/sidebar.doc";
import { skeletonDoc } from "#/components/examples/docs/skeleton/skeleton.doc";
import { sliderDoc } from "#/components/examples/docs/slider/slider.doc";
import { sonnerDoc } from "#/components/examples/docs/sonner/sonner.doc";
import { spinnerDoc } from "#/components/examples/docs/spinner/spinner.doc";
import { switchDoc } from "#/components/examples/docs/switch/switch.doc";
import { tableDoc } from "#/components/examples/docs/table/table.doc";
import { tabsDoc } from "#/components/examples/docs/tabs/tabs.doc";
import { textareaDoc } from "#/components/examples/docs/textarea/textarea.doc";
import { toggleGroupDoc } from "#/components/examples/docs/toggle-group/toggle-group.doc";
import { toggleDoc } from "#/components/examples/docs/toggle/toggle.doc";
import { tooltipDoc } from "#/components/examples/docs/tooltip/tooltip.doc";

export type { ApiGroup, ComponentDoc, DocExample } from "#/components/examples/docs/types";

export const COMPONENT_DOCS: Record<string, ComponentDoc> = {
  // Display
  badge: badgeDoc,
  avatar: avatarDoc,
  spinner: spinnerDoc,
  kbd: kbdDoc,
  "aspect-ratio": aspectRatioDoc,
  carousel: carouselDoc,
  empty: emptyDoc,
  alert: alertDoc,
  item: itemDoc,
  chart: chartDoc,
  table: tableDoc,

  // Form
  button: buttonDoc,
  input: inputDoc,
  select: selectDoc,
  checkbox: checkboxDoc,
  slider: sliderDoc,
  switch: switchDoc,
  "radio-cards": radioCardsDoc,
  calendar: calendarDoc,
  field: fieldDoc,
  "toggle-group": toggleGroupDoc,
  "input-otp": inputOtpDoc,
  label: labelDoc,
  "input-number": inputNumberDoc,
  "input-password": inputPasswordDoc,
  "input-search": inputSearchDoc,
  textarea: textareaDoc,
  toggle: toggleDoc,
  "radio-group": radioGroupDoc,
  "checkbox-group": checkboxGroupDoc,
  "button-group": buttonGroupDoc,
  "input-group": inputGroupDoc,
  "native-select": nativeSelectDoc,
  radio: radioDoc,
  "checkbox-cards": checkboxCardsDoc,
  form: formDoc,

  // Navigation
  tabs: tabsDoc,
  breadcrumb: breadcrumbDoc,
  pagination: paginationDoc,
  menubar: menubarDoc,
  "navigation-menu": navigationMenuDoc,
  sidebar: sidebarDoc,

  // Overlay
  dialog: dialogDoc,
  popover: popoverDoc,
  tooltip: tooltipDoc,
  command: commandDoc,
  "dropdown-menu": dropdownMenuDoc,
  "context-menu": contextMenuDoc,
  sheet: sheetDoc,
  "alert-dialog": alertDialogDoc,
  drawer: drawerDoc,
  "hover-card": hoverCardDoc,

  // Feedback
  sonner: sonnerDoc,
  progress: progressDoc,
  "progress-circle": progressCircleDoc,
  skeleton: skeletonDoc,

  // Layout
  accordion: accordionDoc,
  card: cardDoc,
  separator: separatorDoc,
  collapsible: collapsibleDoc,
  "scroll-area": scrollAreaDoc,
  resizable: resizableDoc,
};
