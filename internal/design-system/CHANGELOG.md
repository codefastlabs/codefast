# @internal/design-system

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
