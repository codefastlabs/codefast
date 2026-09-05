# @codefast/benchmark-viewer

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
