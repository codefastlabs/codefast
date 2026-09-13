# @codefast/benchmark-viewer

## 0.9.0

### Minor Changes

- [#861](https://github.com/codefastlabs/codefast/pull/861) [`e7665ee`](https://github.com/codefastlabs/codefast/commit/e7665eed0afd49310e756d6f86756c4f9accefc5) Thanks [@thevuong](https://github.com/thevuong)! - Partition the run history by configuration, the way it already partitions by environment. Each run carries a
  `configKey`/`configLabel` derived from its execution shape, timing profile, and trial count, and the chart defaults to
  the newest run's configuration so incomparable regimes — `isolated` vs `shared`, `fast` vs `full` — never share a line
  until the reader widens to "All configs". A Configuration selector appears when the history holds more than one, and a
  banner warns while "All configs" is showing more than one.

- [#861](https://github.com/codefastlabs/codefast/pull/861) [`c00ae92`](https://github.com/codefastlabs/codefast/commit/c00ae92ff89b1a7e1d779c17d87cac4ce0066e87) Thanks [@thevuong](https://github.com/thevuong)! - Serve a run's `report.md` and `report.json` for download, derived on demand from its `observations.jsonl`. A suite opts
  in by passing `deriveReport` to `startBenchServer`; the server then answers `/api/report.md` and `/api/report.json`
  (with a `run` id, or the newest run by default) as attachments, and the viewer shows Download links for the newest run
  in the current filter. Payloads carry `reportsAvailable` so the links appear only when the server can derive them.

- [#861](https://github.com/codefastlabs/codefast/pull/861) [`b26c8a4`](https://github.com/codefastlabs/codefast/commit/b26c8a4008ec87651da2a54f2aa6006c51ab6fc2) Thanks [@thevuong](https://github.com/thevuong)! - Surface the within-group cost in the viewer. A suite passes `scenarioBaselines` (each scenario id mapped to its
  within-group baseline) to `startBenchServer`; when the selected scenario names a baseline, the viewer shows each
  library's throughput relative to that baseline over the plotted runs — the same within-group ratio the report's
  "Within-group cost" section carries, so the cost of a variant (such as enabling `tailwind-merge`) is legible on the
  history page too.

### Patch Changes

- [#861](https://github.com/codefastlabs/codefast/pull/861) [`10e8142`](https://github.com/codefastlabs/codefast/commit/10e814253e3e38bbbfc4604473c6e4cb4cef3916) Thanks [@thevuong](https://github.com/thevuong)! - Two control-panel visual fixes. Every filter `select` now draws its own chevron inset `0.75rem` from the right edge
  (`appearance: none` plus a custom glyph) instead of the browser arrow jammed against the border. And the report-download
  links drop their vivid accent blue for the same muted button treatment as the panel's other controls, so they no longer
  clash with the surrounding grey UI.

- [#861](https://github.com/codefastlabs/codefast/pull/861) [`eb7d819`](https://github.com/codefastlabs/codefast/commit/eb7d8190cb7464cc759e224ad05484ee88db2e84) Thanks [@thevuong](https://github.com/thevuong)! - Stop exporting `WithinGroupCostEntry` — it is only used within `use-derived-payload.ts`, so the export was flagged as
  unused. No behaviour change.

- [#861](https://github.com/codefastlabs/codefast/pull/861) [`6c813aa`](https://github.com/codefastlabs/codefast/commit/6c813aa03be010afc8b2e125639341c73f075c3a) Thanks [@thevuong](https://github.com/thevuong)! - Let the page use the full viewport width. The layout dropped its centered `max-w-7xl` container (and the header's
  `max-w-4xl` cap), so on a wide screen the chart spans the whole width and the control panel fits every filter on one row
  instead of wrapping. Reading widths stay bounded where they matter — the intro copy keeps its `max-w-prose`.

- [#861](https://github.com/codefastlabs/codefast/pull/861) [`7d72fd7`](https://github.com/codefastlabs/codefast/commit/7d72fd7e394e3e62ff406dd5ebdb438ff5591346) Thanks [@thevuong](https://github.com/thevuong)! - Rework the chart palette so every series is easy to tell apart. It held five hues while the `di` suite plots seven
  libraries, so `paletteMap`'s modulo handed two pairs the same colour (`@codefast/di` and `ditox` both teal, `inversify`
  and `injection-js` both blue). The palette now carries seven hues chosen for the widest pairwise separation — its
  closest pair is far more distinct than before, no two lines read alike, and each hue also stays clear of the ratio
  colours. A note records that it must stay at least as long as the largest suite's library count.

- [#861](https://github.com/codefastlabs/codefast/pull/861) [`1e22a7d`](https://github.com/codefastlabs/codefast/commit/1e22a7deff616c0c80aa2816f8928938a806bbce) Thanks [@thevuong](https://github.com/thevuong)! - Make the chart tooltip swatches show each series' true colour. Chart.js fills a tooltip's colour box with the dataset's
  `backgroundColor`, which for a line is the near-transparent fill under the curve (alpha `0.08`), so the swatches read as
  washed-out. A `labelColor` callback now paints each swatch with the line's solid, opaque colour instead.
- Updated dependencies [[`5c376d5`](https://github.com/codefastlabs/codefast/commit/5c376d5f9ff842103167ae0dd1afd9aed10c0199), [`fcbe338`](https://github.com/codefastlabs/codefast/commit/fcbe338d91de80b9476c41f2168828def26d1435), [`a836f8b`](https://github.com/codefastlabs/codefast/commit/a836f8b6b5ab1f16d9943d484e42793ff69f5d1c), [`765967b`](https://github.com/codefastlabs/codefast/commit/765967bd873d527d17ff7bfbb58d1563edd32438), [`36081f9`](https://github.com/codefastlabs/codefast/commit/36081f9643067b96f065e0687d78908074490f6f), [`06618b6`](https://github.com/codefastlabs/codefast/commit/06618b6c152f899f5cb7e010abfe554c58ddf7c5)]:
  - @internal/benchmark-harness@0.9.0

## 0.8.0

### Minor Changes

- [#825](https://github.com/codefastlabs/codefast/pull/825) [`c5aa94d`](https://github.com/codefastlabs/codefast/commit/c5aa94d4685c60449673e93a2e1b8b74df7ded67) Thanks [@thevuong](https://github.com/thevuong)! - The chart can overlay every row of the selected scenario's group — one line per row and library, a colour family per
  library with a shade, a dash pattern and a marker shape per row, the selected row at full weight while the others recede
  with sparse markers — so the configurations of one workload read against each other on a single chart instead of one
  chart per row. A legend table under the chart lists each row's newest value per library and its ratio to the selected
  row; clicking a row selects it, its checkbox hides it, hovering it lifts its lines. Tooltips sort fastest first and
  carry the same ratios. Bands and ratio lines stay off while the overlay is on, and a log axis labels only the 1, 2 and 5
  of each decade. A `viewDefaults` server option lets a suite open with the overlay and the log axis already on.

  Every run now reports in the newest run's `batch` unit, so a suite changing how many operations one timed iteration
  performs no longer reads as a jump in throughput; dashed rules mark the runs where a row's `batch`, description or the
  primary library's version changed; a **Relative to first run** toggle indexes every line to its own first plotted run;
  and the sticky control panel folds to its scenario row while scrolling unless pinned. A scenario's group and description
  come from the newest run that recorded them rather than the oldest, so a row a suite regroups moves with it.

### Patch Changes

- Updated dependencies [[`6d1347a`](https://github.com/codefastlabs/codefast/commit/6d1347a1e6a140aafb1dc552175551902993e94b), [`98fc6c7`](https://github.com/codefastlabs/codefast/commit/98fc6c76421c35e687f115dd4969f3cc60cd1282)]:
  - @codefast/benchmark-harness@0.8.0
  - @codefast/tailwind-variants@0.8.0

## 0.7.2

### Patch Changes

- [#810](https://github.com/codefastlabs/codefast/pull/810) [`75c63d2`](https://github.com/codefastlabs/codefast/commit/75c63d2abbb713d88489058c1c57bbc6e10f9358) Thanks [@thevuong](https://github.com/thevuong)! - Enable `exactOptionalPropertyTypes` for the packages that were temporarily opted out when it became the `base.json`
  default (`@codefast/cli`, `@codefast/tailwind-variants`, and the private benchmark packages). Only `@codefast/cli` and
  `@codefast/benchmark-viewer` needed code: the optional fields the flag surfaces on their exported request/option/prop
  types are widened to `?: T | undefined`. Backward-compatible type change — no runtime effect.

- [#777](https://github.com/codefastlabs/codefast/pull/777) [`05a9ba9`](https://github.com/codefastlabs/codefast/commit/05a9ba98ff2d0ee59d1a4d9f646d5130588c5abb) Thanks [@thevuong](https://github.com/thevuong)! - Move the package from `packages/` to `internal/`, the new home for private workspace packages. The package name and API
  are unchanged.
- Updated dependencies [[`05a9ba9`](https://github.com/codefastlabs/codefast/commit/05a9ba98ff2d0ee59d1a4d9f646d5130588c5abb), [`37a212b`](https://github.com/codefastlabs/codefast/commit/37a212b4d805588413159e11e872b98db82326bf), [`83cceeb`](https://github.com/codefastlabs/codefast/commit/83cceeb2168e063441125643a83e9555fb2d2048), [`ba04d27`](https://github.com/codefastlabs/codefast/commit/ba04d2703c59a1677f52e6a9fffd0ec202328218), [`ad2f93a`](https://github.com/codefastlabs/codefast/commit/ad2f93a688e99c3ed8be6ceeae9d6cdd6be861bc), [`6cd6a0e`](https://github.com/codefastlabs/codefast/commit/6cd6a0e88f8c004c2e4e646c104d46169f3e86ed)]:
  - @codefast/benchmark-harness@0.7.2
  - @codefast/tailwind-variants@0.7.1

## 0.7.1

### Patch Changes

- [#748](https://github.com/codefastlabs/codefast/pull/748) [`bde6d1b`](https://github.com/codefastlabs/codefast/commit/bde6d1b46f55f65039f8a3c8e062693fe328952a) Thanks [@thevuong](https://github.com/thevuong)! - Derive client-only view state without effect setState: the footer clocks and palette shortcut hint gate on a shared
  hydration hook, the palette highlight becomes one epoch-tagged state with a derived index, and the chart drops its
  sync-callback ref indirection.
- Updated dependencies [[`bde6d1b`](https://github.com/codefastlabs/codefast/commit/bde6d1b46f55f65039f8a3c8e062693fe328952a)]:
  - @codefast/benchmark-harness@0.7.1

## 0.7.0

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.7.0
  - @codefast/tailwind-variants@0.7.0

## 0.6.2

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.6.2
  - @codefast/tailwind-variants@0.6.2

## 0.6.1

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.6.1
  - @codefast/tailwind-variants@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [[`1a8c0f3`](https://github.com/codefastlabs/codefast/commit/1a8c0f3d001ce2501b7008689c30439fb8b85b5d), [`8fb6921`](https://github.com/codefastlabs/codefast/commit/8fb6921cdb0e15a1414302ef46663f8af2abe8c8), [`33e5d80`](https://github.com/codefastlabs/codefast/commit/33e5d804ae9ac5c9cb18228248781f285b58feeb), [`6613976`](https://github.com/codefastlabs/codefast/commit/661397662480dd403a18f3a3fcb4117fafb9c43b), [`2545cdb`](https://github.com/codefastlabs/codefast/commit/2545cdbd8dd54f9a5382bb480373f179a7e3821a), [`ea48ae2`](https://github.com/codefastlabs/codefast/commit/ea48ae205305ee7913cf0ade11f3dc32f6cac874), [`fe7e9e4`](https://github.com/codefastlabs/codefast/commit/fe7e9e46c6f42b8ae0bc5070656e085a4fe60436), [`93b18ac`](https://github.com/codefastlabs/codefast/commit/93b18ac606e7fa6b5de95ca2679a38585c072e5c), [`710d533`](https://github.com/codefastlabs/codefast/commit/710d5332cff3244e6c1dbe9bb5e2bdccb9eec39c), [`d0dd326`](https://github.com/codefastlabs/codefast/commit/d0dd326e01d2bf3ecdf9283384bda22f07c2a6fe)]:
  - @codefast/benchmark-harness@0.6.0
  - @codefast/tailwind-variants@0.6.0

## 0.5.0

### Patch Changes

- [#676](https://github.com/codefastlabs/codefast/pull/676) [`641e233`](https://github.com/codefastlabs/codefast/commit/641e2338d77fb61be2ca585a5986f34cf32ec746) Thanks [@thevuong](https://github.com/thevuong)! - Collapse the `types` and `default` lanes of `package.json#imports` from fallback arrays to single strings.

  Node resolves an imports array by taking the first candidate it can parse, without checking that the file exists and without falling through — a specifier whose first candidate is missing throws `ERR_MODULE_NOT_FOUND` rather than trying the second. `./dist/*/index.js` and `./dist/*/index.d.ts` could therefore never be reached, so they read as a safety net that does not exist. The `source` lane keeps its extension candidates, which only `tsc` and Vite read and both probe.

- Updated dependencies [[`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`3044f96`](https://github.com/codefastlabs/codefast/commit/3044f96c4ea8987e8af8583b3b90e0f5c2021105), [`15b732a`](https://github.com/codefastlabs/codefast/commit/15b732a8ade895dec5df464e9ba30f646e0bf39d), [`641e233`](https://github.com/codefastlabs/codefast/commit/641e2338d77fb61be2ca585a5986f34cf32ec746)]:
  - @codefast/benchmark-harness@0.5.0
  - @codefast/tailwind-variants@0.5.0

## 0.5.0-canary.9

### Patch Changes

- [#676](https://github.com/codefastlabs/codefast/pull/676) [`641e233`](https://github.com/codefastlabs/codefast/commit/641e2338d77fb61be2ca585a5986f34cf32ec746) Thanks [@thevuong](https://github.com/thevuong)! - Collapse the `types` and `default` lanes of `package.json#imports` from fallback arrays to single strings.

  Node resolves an imports array by taking the first candidate it can parse, without checking that the file exists and without falling through — a specifier whose first candidate is missing throws `ERR_MODULE_NOT_FOUND` rather than trying the second. `./dist/*/index.js` and `./dist/*/index.d.ts` could therefore never be reached, so they read as a safety net that does not exist. The `source` lane keeps its extension candidates, which only `tsc` and Vite read and both probe.

- Updated dependencies [[`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`15b732a`](https://github.com/codefastlabs/codefast/commit/15b732a8ade895dec5df464e9ba30f646e0bf39d), [`641e233`](https://github.com/codefastlabs/codefast/commit/641e2338d77fb61be2ca585a5986f34cf32ec746)]:
  - @codefast/benchmark-harness@0.5.0-canary.9
  - @codefast/tailwind-variants@0.5.0-canary.9

## 0.5.0-canary.8

### Patch Changes

- Updated dependencies [[`3044f96`](https://github.com/codefastlabs/codefast/commit/3044f96c4ea8987e8af8583b3b90e0f5c2021105)]:
  - @codefast/benchmark-harness@0.5.0-canary.8
  - @codefast/tailwind-variants@0.5.0-canary.8

## 0.5.0-canary.7

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.5.0-canary.7
  - @codefast/tailwind-variants@0.5.0-canary.7

## 0.5.0-canary.6

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.5.0-canary.6
  - @codefast/tailwind-variants@0.5.0-canary.6

## 1.0.0-canary.7

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@1.0.0-canary.7
  - @codefast/tailwind-variants@1.0.0-canary.7

## 1.0.0-canary.6

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@1.0.0-canary.6
  - @codefast/tailwind-variants@1.0.0-canary.6

## 0.5.0-canary.5

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.5.0-canary.5
  - @codefast/tailwind-variants@0.5.0-canary.5

## 0.5.0-canary.4

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.5.0-canary.4
  - @codefast/tailwind-variants@0.5.0-canary.4

## 0.5.0-canary.3

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.5.0-canary.3
  - @codefast/tailwind-variants@0.5.0-canary.3

## 0.5.0-canary.2

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.5.0-canary.2
  - @codefast/tailwind-variants@0.5.0-canary.2

## 0.5.0-canary.1

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.5.0-canary.1
  - @codefast/tailwind-variants@0.5.0-canary.1

## 0.5.0-canary.0

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.5.0-canary.0
  - @codefast/tailwind-variants@0.5.0-canary.0

## 0.4.0

### Patch Changes

- [`f680df9`](https://github.com/codefastlabs/codefast/commit/f680df903510b91c35f1c342d79e50c0672a4c19) Thanks [@thevuong](https://github.com/thevuong)! - Prefer immutable array methods (`toSorted`, `toReversed`) and drop redundant casts in the report quantiles, payload builder, and viewer components.

- [`dd9e844`](https://github.com/codefastlabs/codefast/commit/dd9e844608142792f0f6519d552eb2bcbe6c4bc3) Thanks [@thevuong](https://github.com/thevuong)! - Migrate HTTP server from raw node:http to Hono for routing, streaming, and ETag handling.

- [`f79b333`](https://github.com/codefastlabs/codefast/commit/f79b333d0599c19028f29b9889afcbfb99db91a1) Thanks [@thevuong](https://github.com/thevuong)! - feat(dev): enable source condition for zero-rebuild HMR in apps/docs

- Updated dependencies [[`f680df9`](https://github.com/codefastlabs/codefast/commit/f680df903510b91c35f1c342d79e50c0672a4c19), [`2397801`](https://github.com/codefastlabs/codefast/commit/239780172d7a71c3426382ec66309ec7f39bd883), [`6350584`](https://github.com/codefastlabs/codefast/commit/635058490b7c08a07771897403107b3ae86fca19), [`f79b333`](https://github.com/codefastlabs/codefast/commit/f79b333d0599c19028f29b9889afcbfb99db91a1), [`8432414`](https://github.com/codefastlabs/codefast/commit/8432414b941a61f67800c378da73c8f45913913f), [`6c3ac44`](https://github.com/codefastlabs/codefast/commit/6c3ac44b7ddb9e5bcf3fbe0757e00ef86f27b513), [`f26e846`](https://github.com/codefastlabs/codefast/commit/f26e8460e982171bfde13a7bd3fab4543e933df4), [`d07b567`](https://github.com/codefastlabs/codefast/commit/d07b5671661e0fbef03fbbf42c1d603a65d796e5), [`649cf5a`](https://github.com/codefastlabs/codefast/commit/649cf5a63b654dd6517ff472a1c2a0e35db86fdf)]:
  - @codefast/benchmark-harness@0.4.0
  - @codefast/tailwind-variants@0.4.0

## 0.4.0-canary.6

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.4.0-canary.6
  - @codefast/tailwind-variants@0.4.0-canary.6

## 0.4.0-canary.5

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.4.0-canary.5
  - @codefast/tailwind-variants@0.4.0-canary.5

## 0.4.0-canary.4

### Patch Changes

- [#495](https://github.com/codefastlabs/codefast/pull/495) [`7b4e2fd`](https://github.com/codefastlabs/codefast/commit/7b4e2fde5a76fd4452e17b2aff5b94f7d669722b) Thanks [@thevuong](https://github.com/thevuong)! - Prefer immutable array methods (`toSorted`, `toReversed`) and drop redundant casts in the report quantiles, payload builder, and viewer components.

- Updated dependencies [[`7b4e2fd`](https://github.com/codefastlabs/codefast/commit/7b4e2fde5a76fd4452e17b2aff5b94f7d669722b), [`fa338d6`](https://github.com/codefastlabs/codefast/commit/fa338d61fbfafb94beaa4d05d93d01e2c005cc91), [`b097689`](https://github.com/codefastlabs/codefast/commit/b0976892cae3433670837aee0872262d38be0f45), [`7a4f8c3`](https://github.com/codefastlabs/codefast/commit/7a4f8c3b487526a319c6808d1164ba1c8168e9b6)]:
  - @codefast/benchmark-harness@0.4.0-canary.4
  - @codefast/tailwind-variants@0.4.0-canary.4

## 0.3.16-canary.3

### Patch Changes

- [`6149d30`](https://github.com/codefastlabs/codefast/commit/6149d30a3c20f1f4324b140525b6374a935aaabd) Thanks [@thevuong](https://github.com/thevuong)! - Migrate HTTP server from raw node:http to Hono for routing, streaming, and ETag handling.

- [`2a82188`](https://github.com/codefastlabs/codefast/commit/2a82188264c204b0b519b3324402ae962594d29b) Thanks [@thevuong](https://github.com/thevuong)! - feat(dev): enable source condition for zero-rebuild HMR in apps/docs

- Updated dependencies [[`2a82188`](https://github.com/codefastlabs/codefast/commit/2a82188264c204b0b519b3324402ae962594d29b)]:
  - @codefast/benchmark-harness@0.3.16-canary.3
  - @codefast/tailwind-variants@0.3.16-canary.3
