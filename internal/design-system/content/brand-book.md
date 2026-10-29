Codefast UI is a quiet, neutral-first component system with one brand hue. Surfaces are white or near-black zinc,
separated by a hairline rather than shadow; the sky `primary` is spent on the single action that matters on a screen.
Controls are compact (32px tall), rounded at `radius-lg`, set in Inter at 14px. Everything is themeable in plain CSS:
the tokens below are the palette the codefastlabs.com site ships, and the same components accept any palette the package
offers (see Palettes).

## Content fundamentals

Write like the library's own docs: plain, direct, second person, present tense.

- **Address the reader as "you".** "You bring the Tailwind pipeline; the package ships the components." Never "we" for
  the product, never "the user" in UI copy.
- **Sentence case everywhere**: buttons, titles, menu items, table headers. `Save changes`, `Create project`,
  `No results found` — not `Save Changes`.
- **Lead with the verb on actions.** Buttons and menu items are imperative and short: `Continue`, `Delete account`,
  `Copy link`. A destructive action names what it destroys.
- **Titles state the thing, descriptions state the consequence.** DialogTitle `Delete project?`; DialogDescription
  `This permanently removes the project and its deployments. You can't undo this.`
- **No emoji, no exclamation marks** in interface copy. Status is carried by its color (`destructive`, `warning`,
  `success`), an icon and a word, never by an emoji.
- **Keyboard shortcuts** are shown as glyphs in `Kbd` or a menu `Shortcut`: `⌘K`, `⇧⌘P`.
- **Numbers** in data views use tabular figures (`tabular-nums`), in the `data` style when shown in charts.

## Visual foundations

### Color

- Paint the page `background`; set copy in `foreground`. Secondary copy — descriptions, placeholders, helper text — is
  `muted-foreground`.
- `primary` is the brand: the default Button, checked Checkbox/Radio/Switch, Slider range and Progress fill. Use **one**
  primary Button per view; everything else is `outline`, `secondary` or `ghost`.
- Lay content on `card` (Card, Alert); float it on `popover` (menus, Select, Popover, HoverCard, Command, and modal
  surfaces — Dialog, AlertDialog, Sheet, Drawer).
- Hover and focus states use `accent` in menus and `muted` on buttons (`ghost`, `outline`). A pressed Button nudges down
  1px (`active:translate-y-px`); a hovered primary Button deepens toward `foreground` (`hover:bg-primary-hover`), so its
  label gains contrast rather than losing it.
- `destructive` is never a solid fill behind white text. Destructive Buttons, Badges and Bubbles are a 10% tint of
  `destructive` with `destructive` as the text color, deepening to 15% on hover (20% and 25% in dark). Keep the hover
  tint that light: a deeper one pulls the fill toward the text and drops it under 4.5:1. Invalid fields add a
  `destructive` border and a 3px `destructive/20` ring. `success` and `warning` take the same tints; their
  `*-foreground` is for a solid fill.
- Borders: every element defaults to `border`; form controls draw their boundary in `control`, the same hairline as
  `input`. In dark, `border` and `input` are white at 10% and 15%, so they lift rather than darken. A viewer who asks
  their system for more contrast (`prefers-contrast: more`) gets `control` at 3:1 on every surface. Card, Dialog,
  AlertDialog and the floating menus are outlined by a 1px `foreground/10` ring instead, which tracks the scheme on its
  own.
- Charts use `chart-1` … `chart-5`, five steps of the palette hue from light to dark. Pair a series color with a label
  or legend; never encode meaning in hue alone.
- **Contrast you must design around**, measured from the tokens on every build:

{{contrast}}

- Dark mode is a class, not a media query: the tokens switch under `.dark` on `<html>` (in this system's previews,
  `data-theme="dark"`). The `@codefast/theme` package resolves the user's appearance to that class.

### Typography

- One family: **Inter Variable** (`fonts/InterVariable-latin.woff2`, weights 100–900) for both `sans` and `heading`;
  `mono` is the platform monospace stack. The package itself ships no font — the consuming app sets `--font-sans`,
  `--font-heading` and `--font-mono`; without them the components fall back to `ui-sans-serif, system-ui`.
- Set interface copy in `body` (14px / 20px). It is the library's default size by a wide margin.
- Labels, button text and tab triggers are `label` — the same 14px at weight 500. Weight, not size, separates a label
  from body.
- Card, Dialog, Sheet and Drawer titles are `title`: `font-heading`, 16px, weight 500 — not bold. The system never uses
  weight 700 in a component.
- Text typed into a field is `input` (16px) on small screens so iOS does not zoom, stepping to `body` from the `md`
  breakpoint.
- Badges and Kbd use `caption` (12px / 500). Menu shortcuts use `shortcut`: 12px with `0.1em` tracking in
  `muted-foreground`.

### Spacing and sizing

- One unit, `spacing` = 0.25rem; every padding, gap and size is a multiple. Scale the whole library's density by
  changing `spacing` alone.
- Control heights: `spacing-8` (32px) default, `spacing-7` (28px) `sm`, 24px `xs`, `spacing-9` (36px) `lg`. Icon buttons
  are square at the same sizes.
- Inside controls: horizontal padding `spacing-2.5`, icon gap `spacing-1.5`. Icons inside buttons are 16px (`size-4`),
  12–14px in `xs`/`sm`.
- Cards: one `--card-spacing` sets the inset and the gap between sections — `spacing-4`, or `spacing-3` at `size="sm"`.
  Dialogs pad and gap at `spacing-4`. Fields in a FieldGroup stack `spacing-5` apart; a label sits `spacing-2` above its
  control.

### Shape

- One unit, `radius` = 0.375rem; the scale derives from it in sixths (`radius-sm` = 4/6, `radius-lg` = 8/6,
  `radius-xl` = 2×…). Override `radius` once to square off or soften everything.
- Controls — Button, Input, Select, Textarea, Popover, menus — are `radius-lg`, and so is Alert. Menu items inside them
  are `radius-md`.
- Containers — Card, Dialog, AlertDialog, Command, Empty — are `radius-xl`. Toasts `radius-2xl`.
- Pills and discs (`radius-full`): Avatar, Switch, Radio, Spinner, Progress; Badge uses `radius-4xl`.
- The brand mark is the same idea at icon scale: four 24-unit tiles cut at radius 6, a quarter of their side.

### Elevation

- Flat by default. Resting fields, the `outline` Button and Card carry only `shadow-xs`; the separation comes from
  `border` or the `foreground/10` ring.
- Floating layers step up: `shadow-md` for Popover, DropdownMenu, Select, HoverCard; `shadow-lg` for Sheet and
  sub-menus; `shadow-xl` for the Chart tooltip.
- Overlays (Dialog, Sheet, Drawer backdrop) are `black/10` with a light backdrop blur. Floating layers sit at `z-50`.

### Focus and states

- Every focusable element shows the same focus treatment: a solid 2px `ring` outline, offset 2px from the element
  (`focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring`). The
  preset's base layer gives `:focus-visible` that outline too, so your own focusable elements get it without a class;
  Sidebar parts draw it in `sidebar-ring`. `ring` holds 3:1 against every surface in both schemes, and an outline
  survives forced-colors mode. Never remove it.
- Disabled is `opacity-50` with pointer events off — no separate disabled colors.
- Invalid (`aria-invalid`) is `destructive` border + `destructive/20` ring (`/40` in dark).
- State is read from data attributes (`data-open`, `data-checked`, `data-disabled`, `data-selected`…), which the preset
  maps for both Radix `data-state` and boolean `data-*`.

### Motion

Motion is short and purposeful. The token file carries Tailwind's easing curves, but not the preset's own, so these are
the preset's values, read from `motion.css` on every build.

{{motion}}

- Exits are shorter than their enters and use `ease-exit`, accelerating away.
- Popups fade and zoom from 95% and slide 8px from the side they open on.
- `ease-spring` (overshoot) is opt-in, never a default.
- Loading text uses the `shimmer` utility (2s linear, set `--shimmer-duration` to change it); Skeleton sweeps with
  `animate-shimmer` (2.2s linear). Scrollers fade their edges with `scroll-fade`.
- Under `prefers-reduced-motion: reduce` the preset cuts every animation and transition to near zero, so overlays still
  finish opening and closing. Opt essential motion back in with an important utility (`motion-reduce:duration-200!`).

### Layout

- Sidebar docks from `breakpoint-sidebar` (48rem) and is a Sheet below it.
- The library is RTL-ready: it uses logical properties (`ps-`, `me-`, `start-`), so a `dir="rtl"` ancestor mirrors every
  component.

### Tailwind's defaults

The system carries Tailwind v4's whole default theme, not only the steps the components use, so you can build beside
them with the same scales. The components themselves read the semantic tokens, which resolve to steps of these.

- **Palette**: every hue at 50–950, plus `black` and `white`, in Colors (`red-500`, `zinc-200`).
- **Type**: the `type-xs` … `type-9xl` styles under Typography are `text-xs` … `text-9xl`; weights, tracking and leading
  are the `fontWeight`, `tracking` and `leading` families.
- **Space and shape**: every `spacing` multiple, from `spacing-0` to `spacing-96`; the radius scale derives from
  `radius`.
- **Layout**: `breakpoint-sm` … `breakpoint-2xl`, and `container-3xs` … `container-7xl` for `max-w-*` and `@container`.
- **Elevation and effects**: box, inset, drop and text shadows, `blur-*` and `perspective-*`.
- **Motion**: `ease-in`, `ease-out`, `ease-in-out`, the four `animate-*` presets and the default transition.

## Iconography

- Icons are **Lucide** (`lucide-react`), stroked line icons on a 24px grid with a 2px stroke and round caps and joins.
  The `Icons` group holds the ones the components themselves render (chevrons, check, x, search, eye, the alert glyphs,
  the loader).
- In components icons render at 16px (`size-4`) and inherit the text color. The copies in `Icons` are drawn in zinc-900
  because an `<img>` cannot inherit color; in code, import from `lucide-react` instead.
- Status icons pair with words: `CircleCheck` success, `Info` info, `TriangleAlert` warning, `OctagonX` error (the Toast
  set), `Loader2` spinning for loading.
- No emoji, no filled or duotone icon sets beside Lucide.

## Brand marks

- The mark is four rounded tiles: the lead tile in sky (`#0084d1` light, `#00bcff` dark) and three trailing tiles in ink
  at 40%, 40% and 15%. Use `mark.svg` on light grounds, `mark-dark.svg` on dark, `mark-mono.svg` where only one ink is
  allowed.
- Lockups pair the mark with the `codefast` wordmark: horizontal for headers, stacked for square spaces. Use the `-dark`
  file on dark grounds. Never recolor, outline or rotate the mark.

## Using the components

- Import each component from its own subpath: `import { Button } from "@codefast/ui/button"`. Prop types travel with it
  (`ButtonProps`).
- In your global stylesheet, import Tailwind, one palette, then the preset — in that order:
  `@import "tailwindcss"; @import "@codefast/ui/css/themes/sky.css"; @import "@codefast/ui/css/preset.css";`. Override
  tokens after both.
- Style a non-component like one with its variant function: `buttonVariants({ variant: "outline", size: "sm" })`, merged
  with `cn()`.
- Every rendered element carries `data-slot` naming the component that styles it; target parts by slot, not by class.
- Composition is by parts (`Dialog` › `DialogTrigger` › `DialogContent` › `DialogHeader` › `DialogTitle`); use `asChild`
  to put a trigger's behavior on your own element.
