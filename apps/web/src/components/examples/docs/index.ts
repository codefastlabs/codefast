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
 * 1. Create `docs/<slug>/` with one file per example + a `<slug>.doc.ts`.
 * 2. Register the example sources in `../codes.ts` (the single ?raw barrel).
 * 3. Import the doc below and add it to `COMPONENT_DOCS`.
 */
import type { ComponentDoc } from "#/components/examples/docs/types";
import { accordionDoc } from "#/components/examples/docs/accordion/accordion.doc";
import { badgeDoc } from "#/components/examples/docs/badge/badge.doc";
import { buttonDoc } from "#/components/examples/docs/button/button.doc";
import { calendarDoc } from "#/components/examples/docs/calendar/calendar.doc";
import { cardDoc } from "#/components/examples/docs/card/card.doc";
import { checkboxDoc } from "#/components/examples/docs/checkbox/checkbox.doc";
import { commandDoc } from "#/components/examples/docs/command/command.doc";
import { dialogDoc } from "#/components/examples/docs/dialog/dialog.doc";
import { dropdownMenuDoc } from "#/components/examples/docs/dropdown-menu/dropdown-menu.doc";
import { fieldDoc } from "#/components/examples/docs/field/field.doc";
import { inputDoc } from "#/components/examples/docs/input/input.doc";
import { popoverDoc } from "#/components/examples/docs/popover/popover.doc";
import { progressDoc } from "#/components/examples/docs/progress/progress.doc";
import { radioCardsDoc } from "#/components/examples/docs/radio-cards/radio-cards.doc";
import { selectDoc } from "#/components/examples/docs/select/select.doc";
import { sheetDoc } from "#/components/examples/docs/sheet/sheet.doc";
import { sliderDoc } from "#/components/examples/docs/slider/slider.doc";
import { sonnerDoc } from "#/components/examples/docs/sonner/sonner.doc";
import { switchDoc } from "#/components/examples/docs/switch/switch.doc";
import { tabsDoc } from "#/components/examples/docs/tabs/tabs.doc";
import { tooltipDoc } from "#/components/examples/docs/tooltip/tooltip.doc";

export type { ApiGroup, ComponentDoc, DocExample } from "#/components/examples/docs/types";

export const COMPONENT_DOCS: Record<string, ComponentDoc> = {
  // Display
  badge: badgeDoc,

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

  // Navigation
  tabs: tabsDoc,

  // Overlay
  dialog: dialogDoc,
  popover: popoverDoc,
  tooltip: tooltipDoc,
  command: commandDoc,
  "dropdown-menu": dropdownMenuDoc,
  sheet: sheetDoc,

  // Feedback
  sonner: sonnerDoc,
  progress: progressDoc,

  // Layout
  accordion: accordionDoc,
  card: cardDoc,
};
