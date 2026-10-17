# @internal/design-system

## 0.2.0

### Minor Changes

- [#1103](https://github.com/codefastlabs/codefast/pull/1103) Raise the Node.js floor to 24.15, the first Node 24 release jsdom runs on; jsdom declares
  `^22.22.2 || ^24.15.0 || >=26.0.0`, so the earlier floor claimed Node 24.0–24.14, where the build's renderer refuses to
  run.

### Patch Changes

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
