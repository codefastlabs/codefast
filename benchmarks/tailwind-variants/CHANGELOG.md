# @codefast/benchmark-tailwind-variants

## 0.8.0

### Minor Changes

- [#861](https://github.com/codefastlabs/codefast/pull/861) [`a779a01`](https://github.com/codefastlabs/codefast/commit/a779a01b408dee06051f5a8fc0cc09bf04b4f285) Thanks [@thevuong](https://github.com/thevuong)! - Add `bench:report [run]`, which derives `report.md` and `report.json` for a run from its `observations.jsonl` on demand
  — defaulting to the newest run, or taking a run id or path. The comparison assembly (pivot, competitor order, display
  and short names, presentation) is extracted into `src/harness/comparison.ts` so the live run and the derived report
  build the identical comparison from one source.

- [#861](https://github.com/codefastlabs/codefast/pull/861) [`b215811`](https://github.com/codefastlabs/codefast/commit/b215811542abc13b86033cb79894c151761bdfe5) Thanks [@thevuong](https://github.com/thevuong)! - Declare each with-merge scenario's without-merge baseline (`comparesWithin`) and expose the mapping as
  `SCENARIO_BASELINES`, so the report now carries a "Within-group cost" section: the throughput of every feature with
  `tailwind-merge` relative to the same feature without it, per library. This makes the cost of `tailwind-merge` legible
  directly — near-free on `@codefast/tailwind-variants`, a double-digit tax elsewhere.

### Patch Changes

- [#864](https://github.com/codefastlabs/codefast/pull/864) [`b166185`](https://github.com/codefastlabs/codefast/commit/b166185c683ccbd38fa17764bf20867db89924c8) Thanks [@thevuong](https://github.com/thevuong)! - Declare the library list once in `harness/config.ts` (`BENCH_LIBRARIES`, `COMPETITORS`) with a per-library render
  strategy line, and derive the run header, quiet-mode prefixes, report heading, intro bullets, viewer title, scenario
  listing and viewer library list from it. The report intro points at the run's `observations.jsonl` instead of a
  `latest.jsonl` the harness no longer writes, and the console footer says `pnpm bench:report` derives `report.md` rather
  than implying the run wrote one.

  The run now shows live progress per library on an interactive terminal (plain milestones when piped or verbose) and
  prints the aggregates alone by default; `pnpm bench:verbose` prints the per-scenario table and `pnpm bench:report`
  derives it as `report.md`.

  The console report is now a scoreboard with a geomean-by-group table and the reliable losses, diffs against the run
  `latest.json` names when it is the same configuration on the same machine, and closes with a run card.

- Updated dependencies [[`5c376d5`](https://github.com/codefastlabs/codefast/commit/5c376d5f9ff842103167ae0dd1afd9aed10c0199), [`fcbe338`](https://github.com/codefastlabs/codefast/commit/fcbe338d91de80b9476c41f2168828def26d1435), [`a836f8b`](https://github.com/codefastlabs/codefast/commit/a836f8b6b5ab1f16d9943d484e42793ff69f5d1c), [`765967b`](https://github.com/codefastlabs/codefast/commit/765967bd873d527d17ff7bfbb58d1563edd32438), [`36081f9`](https://github.com/codefastlabs/codefast/commit/36081f9643067b96f065e0687d78908074490f6f), [`06618b6`](https://github.com/codefastlabs/codefast/commit/06618b6c152f899f5cb7e010abfe554c58ddf7c5), [`e7665ee`](https://github.com/codefastlabs/codefast/commit/e7665eed0afd49310e756d6f86756c4f9accefc5), [`10e8142`](https://github.com/codefastlabs/codefast/commit/10e814253e3e38bbbfc4604473c6e4cb4cef3916), [`eb7d819`](https://github.com/codefastlabs/codefast/commit/eb7d8190cb7464cc759e224ad05484ee88db2e84), [`6c813aa`](https://github.com/codefastlabs/codefast/commit/6c813aa03be010afc8b2e125639341c73f075c3a), [`7d72fd7`](https://github.com/codefastlabs/codefast/commit/7d72fd7e394e3e62ff406dd5ebdb438ff5591346), [`c00ae92`](https://github.com/codefastlabs/codefast/commit/c00ae92ff89b1a7e1d779c17d87cac4ce0066e87), [`1e22a7d`](https://github.com/codefastlabs/codefast/commit/1e22a7deff616c0c80aa2816f8928938a806bbce), [`b26c8a4`](https://github.com/codefastlabs/codefast/commit/b26c8a4008ec87651da2a54f2aa6006c51ab6fc2)]:
  - @internal/benchmark-harness@0.9.0
  - @internal/benchmark-viewer@0.9.0

## 0.7.3

### Patch Changes

- [#826](https://github.com/codefastlabs/codefast/pull/826) [`6d1347a`](https://github.com/codefastlabs/codefast/commit/6d1347a1e6a140aafb1dc552175551902993e94b) Thanks [@thevuong](https://github.com/thevuong)! - `bench:serve` now honours the generic `PORT` variable when `BENCH_PORT` is unset, before falling back to the suite's
  default port. A launcher that assigns a free port and announces it through `PORT` — the Claude Code Browser pane with
  `autoPort`, a PaaS — finds the viewer on that port instead of on one the suite chose for itself; `BENCH_PORT` stays the
  explicit override. The harness exposes the precedence as `resolvePreferredPortFromEnvironment(defaultPort)` and the
  `PORT_ENV_KEY` constant, and Turbo passes `PORT` through to `bench:serve`.
- Updated dependencies [[`6d1347a`](https://github.com/codefastlabs/codefast/commit/6d1347a1e6a140aafb1dc552175551902993e94b), [`c5aa94d`](https://github.com/codefastlabs/codefast/commit/c5aa94d4685c60449673e93a2e1b8b74df7ded67), [`98fc6c7`](https://github.com/codefastlabs/codefast/commit/98fc6c76421c35e687f115dd4969f3cc60cd1282)]:
  - @codefast/benchmark-harness@0.8.0
  - @codefast/benchmark-viewer@0.8.0
  - @codefast/tailwind-variants@0.8.0

## 0.7.2

### Patch Changes

- Updated dependencies [[`75c63d2`](https://github.com/codefastlabs/codefast/commit/75c63d2abbb713d88489058c1c57bbc6e10f9358), [`05a9ba9`](https://github.com/codefastlabs/codefast/commit/05a9ba98ff2d0ee59d1a4d9f646d5130588c5abb), [`37a212b`](https://github.com/codefastlabs/codefast/commit/37a212b4d805588413159e11e872b98db82326bf), [`83cceeb`](https://github.com/codefastlabs/codefast/commit/83cceeb2168e063441125643a83e9555fb2d2048), [`ba04d27`](https://github.com/codefastlabs/codefast/commit/ba04d2703c59a1677f52e6a9fffd0ec202328218), [`ad2f93a`](https://github.com/codefastlabs/codefast/commit/ad2f93a688e99c3ed8be6ceeae9d6cdd6be861bc), [`6cd6a0e`](https://github.com/codefastlabs/codefast/commit/6cd6a0e88f8c004c2e4e646c104d46169f3e86ed)]:
  - @codefast/benchmark-viewer@0.7.2
  - @codefast/benchmark-harness@0.7.2
  - @codefast/tailwind-variants@0.7.1

## 0.7.1

### Patch Changes

- Updated dependencies [[`bde6d1b`](https://github.com/codefastlabs/codefast/commit/bde6d1b46f55f65039f8a3c8e062693fe328952a), [`bde6d1b`](https://github.com/codefastlabs/codefast/commit/bde6d1b46f55f65039f8a3c8e062693fe328952a)]:
  - @codefast/benchmark-viewer@0.7.1
  - @codefast/benchmark-harness@0.7.1

## 0.7.0

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.7.0
  - @codefast/benchmark-viewer@0.7.0
  - @codefast/tailwind-variants@0.7.0

## 0.6.2

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.6.2
  - @codefast/benchmark-viewer@0.6.2
  - @codefast/tailwind-variants@0.6.2

## 0.6.1

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.6.1
  - @codefast/benchmark-viewer@0.6.1
  - @codefast/tailwind-variants@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [[`1a8c0f3`](https://github.com/codefastlabs/codefast/commit/1a8c0f3d001ce2501b7008689c30439fb8b85b5d), [`8fb6921`](https://github.com/codefastlabs/codefast/commit/8fb6921cdb0e15a1414302ef46663f8af2abe8c8), [`33e5d80`](https://github.com/codefastlabs/codefast/commit/33e5d804ae9ac5c9cb18228248781f285b58feeb), [`6613976`](https://github.com/codefastlabs/codefast/commit/661397662480dd403a18f3a3fcb4117fafb9c43b), [`2545cdb`](https://github.com/codefastlabs/codefast/commit/2545cdbd8dd54f9a5382bb480373f179a7e3821a), [`ea48ae2`](https://github.com/codefastlabs/codefast/commit/ea48ae205305ee7913cf0ade11f3dc32f6cac874), [`fe7e9e4`](https://github.com/codefastlabs/codefast/commit/fe7e9e46c6f42b8ae0bc5070656e085a4fe60436), [`93b18ac`](https://github.com/codefastlabs/codefast/commit/93b18ac606e7fa6b5de95ca2679a38585c072e5c), [`710d533`](https://github.com/codefastlabs/codefast/commit/710d5332cff3244e6c1dbe9bb5e2bdccb9eec39c), [`d0dd326`](https://github.com/codefastlabs/codefast/commit/d0dd326e01d2bf3ecdf9283384bda22f07c2a6fe)]:
  - @codefast/benchmark-harness@0.6.0
  - @codefast/tailwind-variants@0.6.0
  - @codefast/benchmark-viewer@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies [[`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`3044f96`](https://github.com/codefastlabs/codefast/commit/3044f96c4ea8987e8af8583b3b90e0f5c2021105), [`15b732a`](https://github.com/codefastlabs/codefast/commit/15b732a8ade895dec5df464e9ba30f646e0bf39d), [`641e233`](https://github.com/codefastlabs/codefast/commit/641e2338d77fb61be2ca585a5986f34cf32ec746)]:
  - @codefast/benchmark-harness@0.5.0
  - @codefast/benchmark-viewer@0.5.0
  - @codefast/tailwind-variants@0.5.0

## 0.5.0-canary.9

### Patch Changes

- Updated dependencies [[`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`15b732a`](https://github.com/codefastlabs/codefast/commit/15b732a8ade895dec5df464e9ba30f646e0bf39d), [`641e233`](https://github.com/codefastlabs/codefast/commit/641e2338d77fb61be2ca585a5986f34cf32ec746)]:
  - @codefast/benchmark-harness@0.5.0-canary.9
  - @codefast/benchmark-viewer@0.5.0-canary.9
  - @codefast/tailwind-variants@0.5.0-canary.9

## 0.5.0-canary.8

### Patch Changes

- Updated dependencies [[`3044f96`](https://github.com/codefastlabs/codefast/commit/3044f96c4ea8987e8af8583b3b90e0f5c2021105)]:
  - @codefast/benchmark-harness@0.5.0-canary.8
  - @codefast/benchmark-viewer@0.5.0-canary.8
  - @codefast/tailwind-variants@0.5.0-canary.8

## 0.5.0-canary.7

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.5.0-canary.7
  - @codefast/benchmark-viewer@0.5.0-canary.7
  - @codefast/tailwind-variants@0.5.0-canary.7

## 0.5.0-canary.6

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.5.0-canary.6
  - @codefast/benchmark-viewer@0.5.0-canary.6
  - @codefast/tailwind-variants@0.5.0-canary.6

## 1.0.0-canary.7

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@1.0.0-canary.7
  - @codefast/benchmark-viewer@1.0.0-canary.7
  - @codefast/tailwind-variants@1.0.0-canary.7

## 1.0.0-canary.6

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@1.0.0-canary.6
  - @codefast/benchmark-viewer@1.0.0-canary.6
  - @codefast/tailwind-variants@1.0.0-canary.6

## 0.5.0-canary.5

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.5.0-canary.5
  - @codefast/benchmark-viewer@0.5.0-canary.5
  - @codefast/tailwind-variants@0.5.0-canary.5

## 0.5.0-canary.4

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.5.0-canary.4
  - @codefast/benchmark-viewer@0.5.0-canary.4
  - @codefast/tailwind-variants@0.5.0-canary.4

## 0.5.0-canary.3

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.5.0-canary.3
  - @codefast/benchmark-viewer@0.5.0-canary.3
  - @codefast/tailwind-variants@0.5.0-canary.3

## 0.5.0-canary.2

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.5.0-canary.2
  - @codefast/benchmark-viewer@0.5.0-canary.2
  - @codefast/tailwind-variants@0.5.0-canary.2

## 0.5.0-canary.1

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.5.0-canary.1
  - @codefast/benchmark-viewer@0.5.0-canary.1
  - @codefast/tailwind-variants@0.5.0-canary.1

## 0.5.0-canary.0

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.5.0-canary.0
  - @codefast/benchmark-viewer@0.5.0-canary.0
  - @codefast/tailwind-variants@0.5.0-canary.0

## 0.4.0

### Patch Changes

- [`f79b333`](https://github.com/codefastlabs/codefast/commit/f79b333d0599c19028f29b9889afcbfb99db91a1) Thanks [@thevuong](https://github.com/thevuong)! - feat(dev): enable source condition for zero-rebuild HMR in apps/docs

- Updated dependencies [[`f680df9`](https://github.com/codefastlabs/codefast/commit/f680df903510b91c35f1c342d79e50c0672a4c19), [`2397801`](https://github.com/codefastlabs/codefast/commit/239780172d7a71c3426382ec66309ec7f39bd883), [`dd9e844`](https://github.com/codefastlabs/codefast/commit/dd9e844608142792f0f6519d552eb2bcbe6c4bc3), [`6350584`](https://github.com/codefastlabs/codefast/commit/635058490b7c08a07771897403107b3ae86fca19), [`f79b333`](https://github.com/codefastlabs/codefast/commit/f79b333d0599c19028f29b9889afcbfb99db91a1), [`8432414`](https://github.com/codefastlabs/codefast/commit/8432414b941a61f67800c378da73c8f45913913f), [`6c3ac44`](https://github.com/codefastlabs/codefast/commit/6c3ac44b7ddb9e5bcf3fbe0757e00ef86f27b513), [`f26e846`](https://github.com/codefastlabs/codefast/commit/f26e8460e982171bfde13a7bd3fab4543e933df4), [`d07b567`](https://github.com/codefastlabs/codefast/commit/d07b5671661e0fbef03fbbf42c1d603a65d796e5), [`649cf5a`](https://github.com/codefastlabs/codefast/commit/649cf5a63b654dd6517ff472a1c2a0e35db86fdf)]:
  - @codefast/benchmark-harness@0.4.0
  - @codefast/benchmark-viewer@0.4.0
  - @codefast/tailwind-variants@0.4.0

## 0.4.0-canary.6

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.4.0-canary.6
  - @codefast/benchmark-viewer@0.4.0-canary.6
  - @codefast/tailwind-variants@0.4.0-canary.6

## 0.4.0-canary.5

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.4.0-canary.5
  - @codefast/benchmark-viewer@0.4.0-canary.5
  - @codefast/tailwind-variants@0.4.0-canary.5

## 0.4.0-canary.4

### Patch Changes

- Updated dependencies [[`7b4e2fd`](https://github.com/codefastlabs/codefast/commit/7b4e2fde5a76fd4452e17b2aff5b94f7d669722b), [`fa338d6`](https://github.com/codefastlabs/codefast/commit/fa338d61fbfafb94beaa4d05d93d01e2c005cc91), [`b097689`](https://github.com/codefastlabs/codefast/commit/b0976892cae3433670837aee0872262d38be0f45), [`7a4f8c3`](https://github.com/codefastlabs/codefast/commit/7a4f8c3b487526a319c6808d1164ba1c8168e9b6)]:
  - @codefast/benchmark-harness@0.4.0-canary.4
  - @codefast/benchmark-viewer@0.4.0-canary.4
  - @codefast/tailwind-variants@0.4.0-canary.4

## 0.3.16-canary.3

### Patch Changes

- [`2a82188`](https://github.com/codefastlabs/codefast/commit/2a82188264c204b0b519b3324402ae962594d29b) Thanks [@thevuong](https://github.com/thevuong)! - feat(dev): enable source condition for zero-rebuild HMR in apps/docs

- Updated dependencies [[`6149d30`](https://github.com/codefastlabs/codefast/commit/6149d30a3c20f1f4324b140525b6374a935aaabd), [`2a82188`](https://github.com/codefastlabs/codefast/commit/2a82188264c204b0b519b3324402ae962594d29b)]:
  - @codefast/benchmark-viewer@0.3.16-canary.3
  - @codefast/benchmark-harness@0.3.16-canary.3
  - @codefast/tailwind-variants@0.3.16-canary.3

## 0.3.16-canary.2

### Patch Changes

- Updated dependencies [[`1ad2cb7`](https://github.com/codefastlabs/codefast/commit/1ad2cb73a3f6f8bff2b001e9df2f2492efd89aa2), [`ac54aa0`](https://github.com/codefastlabs/codefast/commit/ac54aa0d3b53acba2f5f75f7ad11b506b249f524), [`7d74f8b`](https://github.com/codefastlabs/codefast/commit/7d74f8bf357a59fa0ff8f6eb388af5d4a538e171), [`3620966`](https://github.com/codefastlabs/codefast/commit/36209662115718c1d86566d36df991e98e1c36ab)]:
  - @codefast/benchmark-harness@0.3.16-canary.2
  - @codefast/tailwind-variants@0.3.16-canary.2

## 0.3.16-canary.1

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.3.16-canary.1
  - @codefast/tailwind-variants@0.3.16-canary.1

## 0.3.16-canary.0

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.3.16-canary.0
  - @codefast/tailwind-variants@0.3.16-canary.0

## 0.3.15

### Patch Changes

- Updated dependencies [[`4df6e65`](https://github.com/codefastlabs/codefast/commit/4df6e6579faf21c6dc7622eb424ad213b120dabb)]:
  - @codefast/tailwind-variants@0.3.15
  - @codefast/benchmark-harness@0.3.15
