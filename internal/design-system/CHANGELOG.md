# @internal/design-system

## 0.3.1

### Patch Changes

- [#1153](https://github.com/codefastlabs/codefast/pull/1153) The build failed once `@codefast/ui`'s palettes declared `success` and `warning`: every color token needs a usage note.
  `control`, `success`, `success-foreground`, `warning` and `warning-foreground` have one, `input` describes its quieter
  roles, the contrast check measures `success` and `warning` as text and on their own tints, and their foregrounds on
  their fills, and the brand book and Palettes page name the new tokens.

- [#1155](https://github.com/codefastlabs/codefast/pull/1155) The contrast check reads `destructive` the way the components paint it: as text on `background`, `card` and `popover`,
  and on its own rest and hover tints over each, composited in gamma-encoded sRGB. A `CONTRAST_PAIRS` entry can name a
  `tint` per scheme for that. The brand book and the `destructive` usage note give the new tints.

- [#1159](https://github.com/codefastlabs/codefast/pull/1159) The README's Publishing steps work from Claude Code: read the artifact first, then publish the changed `project/` files
  with the absolute path of one as the page argument. The `success`, `warning` and raised `control` values name their
  nearest Tailwind swatch, so their usage notes read `green-800`, `amber-800` and the like instead of a sentence.
- Updated dependencies:
  - @codefast/ui@0.15.0

## 0.3.0

### Minor Changes

- [#1131](https://github.com/codefastlabs/codefast/pull/1131) The build no longer mounts the previews in jsdom, and the Node floor drops to 22.22.2, the floor of `@codefast/ui` and
  `@codefast/theme` it builds from.

- [#1132](https://github.com/codefastlabs/codefast/pull/1132) `tokens.json` carries Tailwind v4's whole default theme beside the components' own tokens: the full palette, every
  spacing multiple, the text-size scale as `type-*` styles, every shadow, breakpoints, container widths, font weights,
  tracking, leading, blur, perspective and the easing and animation presets. The brand book says what each family is for,
  and the build fails when two families mint the same token name.

### Patch Changes

- [#1128](https://github.com/codefastlabs/codefast/pull/1128) The build failed after `@codefast/ui`'s `Toaster` began reading its color scheme from `@codefast/theme`: the Toaster
  preview mounted with no `AppearanceProvider`, and the smoke check refused it. Each preview now renders inside an
  `AppearanceProvider`, as the site's root does. `@codefast/theme`'s exports ride on `window.CodefastUI` beside the
  components, so a preview's provider is the same copy `Toaster` reads, and its declarations join `index.d.ts`.

- [#1130](https://github.com/codefastlabs/codefast/pull/1130) The README's Publishing section says Claude Code cannot publish the Codefast UI artifact: it was created from the Design
  System Artifact type, and Claude Code's Artifact tool sends every publish with an `index.html` page entry, which belongs
  to the type, so the server refuses it. It points to the surfaces the type's `SKILL.md` names (a claude.ai chat or
  Cowork), and the steps now diff by size then sha256, leave whitespace-only SVG differences alone, and keep the type's
  `index.html` out of the call.
- Updated dependencies:
  - @codefast/ui@0.14.1
  - @codefast/theme@0.11.0

## 0.2.0

### Minor Changes

- [#1103](https://github.com/codefastlabs/codefast/pull/1103) Raise the Node.js floor to 24.15, the first Node 24 release jsdom runs on; jsdom declares
  `^22.22.2 || ^24.15.0 || >=26.0.0`, so the earlier floor claimed Node 24.0–24.14, where the build's renderer refuses to
  run.

### Patch Changes

- [#1123](https://github.com/codefastlabs/codefast/pull/1123) The design system describes `@codefast/ui` as it is today. The brand book and the token notes now give Card its
  `--card-spacing` of `spacing-4` (`spacing-3` at `size="sm"`), Alert its `radius-lg` and `px-2.5` padding, Field its
  `spacing-2` label gap and FieldGroup its `spacing-5` stack, and name the `foreground/10` ring that outlines Card, Dialog
  and the floating menus. They add the preset's global reduced-motion rule and the base-layer focus outline, tell the
  `shimmer` utility (2s) apart from Skeleton's `animate-shimmer` (2.2s), and keep `shadow-xs` to the `outline` Button and
  Toggle. The focus ring is measured against every surface it is drawn on, as the brand book claims. `index.d.ts` now
  carries every published hook the bundle exposes, read from `@codefast/ui`'s `exports`, and the `indicator` option is
  listed under `ChartTooltipContent`, the part that takes it.
- Updated dependencies:
  - @codefast/ui@0.14.0

## 0.1.1

### Patch Changes

- Updated dependencies:
  - @codefast/ui@0.13.0

## 0.1.0

### Minor Changes

- [#1053](https://github.com/codefastlabs/codefast/pull/1053) A new private package that builds the Codefast UI design system from `@codefast/ui`: tokens read from the palette, the
  preset and Tailwind's theme; a brand book whose contrast and motion sections are measured from the source; and a live
  preview for every component, compiled from its codefastlabs.com registry demo and checked to mount before anything is
  written. `pnpm design-system` runs it through Turborepo, so it rebuilds only when the library, the registry or the brand
  assets change.

### Patch Changes

- Updated dependencies:
  - @codefast/ui@0.12.0
