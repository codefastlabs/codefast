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
import { aspectRatioDoc } from "#/components/examples/docs/aspect-ratio/aspect-ratio.doc";
import { avatarDoc } from "#/components/examples/docs/avatar/avatar.doc";
import { badgeDoc } from "#/components/examples/docs/badge/badge.doc";
import { buttonDoc } from "#/components/examples/docs/button/button.doc";
import { calendarDoc } from "#/components/examples/docs/calendar/calendar.doc";
import { cardDoc } from "#/components/examples/docs/card/card.doc";
import { carouselDoc } from "#/components/examples/docs/carousel/carousel.doc";
import { checkboxDoc } from "#/components/examples/docs/checkbox/checkbox.doc";
import { commandDoc } from "#/components/examples/docs/command/command.doc";
import { contextMenuDoc } from "#/components/examples/docs/context-menu/context-menu.doc";
import { dialogDoc } from "#/components/examples/docs/dialog/dialog.doc";
import { dropdownMenuDoc } from "#/components/examples/docs/dropdown-menu/dropdown-menu.doc";
import { emptyDoc } from "#/components/examples/docs/empty/empty.doc";
import { fieldDoc } from "#/components/examples/docs/field/field.doc";
import { inputOtpDoc } from "#/components/examples/docs/input-otp/input-otp.doc";
import { inputDoc } from "#/components/examples/docs/input/input.doc";
import { kbdDoc } from "#/components/examples/docs/kbd/kbd.doc";
import { labelDoc } from "#/components/examples/docs/label/label.doc";
import { popoverDoc } from "#/components/examples/docs/popover/popover.doc";
import { progressDoc } from "#/components/examples/docs/progress/progress.doc";
import { radioCardsDoc } from "#/components/examples/docs/radio-cards/radio-cards.doc";
import { selectDoc } from "#/components/examples/docs/select/select.doc";
import { separatorDoc } from "#/components/examples/docs/separator/separator.doc";
import { sheetDoc } from "#/components/examples/docs/sheet/sheet.doc";
import { skeletonDoc } from "#/components/examples/docs/skeleton/skeleton.doc";
import { sliderDoc } from "#/components/examples/docs/slider/slider.doc";
import { sonnerDoc } from "#/components/examples/docs/sonner/sonner.doc";
import { spinnerDoc } from "#/components/examples/docs/spinner/spinner.doc";
import { switchDoc } from "#/components/examples/docs/switch/switch.doc";
import { tabsDoc } from "#/components/examples/docs/tabs/tabs.doc";
import { toggleGroupDoc } from "#/components/examples/docs/toggle-group/toggle-group.doc";
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

  // Navigation
  tabs: tabsDoc,

  // Overlay
  dialog: dialogDoc,
  popover: popoverDoc,
  tooltip: tooltipDoc,
  command: commandDoc,
  "dropdown-menu": dropdownMenuDoc,
  "context-menu": contextMenuDoc,
  sheet: sheetDoc,

  // Feedback
  sonner: sonnerDoc,
  progress: progressDoc,
  skeleton: skeletonDoc,

  // Layout
  accordion: accordionDoc,
  card: cardDoc,
  separator: separatorDoc,
};
