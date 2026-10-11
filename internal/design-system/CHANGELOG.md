# @internal/design-system

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
