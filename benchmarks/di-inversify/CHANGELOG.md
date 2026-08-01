# @codefast/benchmark-di-inversify

## 0.5.0

### Patch Changes

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - Fairness fixes from an audit of the di-inversify suite:

  - Scenarios can declare `excludeFromAggregates`: the row still renders, but stays out of every median/geomean, and the report names it. Applied to `circular-dependency-3`, whose two sides never did comparable work per op (codefast throws on the 3rd factory entry; inversify 8.2.3 re-enters the user factory 1413 times before its own error) — it alone carried the `failure` group geomean.
  - The isolated runner's rotation now rotates over the libraries that actually implement each scenario. Rotating the full list and then filtering had left the pivot in the first slot for 3 of every 4 head-to-head rows.
  - Every inversify container now runs `{ jitless: false }`, its fastest documented configuration (codegen resolvers, off by default as a CSP-safe fallback).
  - Re-fixtured `scoped-binding-per-child` (inversify side: per-request child + own singleton bind — its idiom for the same user story; it previously failed its own sanity check and silently dropped out), equalized the `to-self-binding` graph, and hoisted the inversify options literals in `resolution-patterns` to match the codefast side.
  - New `realistic-graph-resolved-root` row binds the shared graph via `toResolved`/`toResolvedValue` — the shape both libraries compile ahead of time, comparing each library's best path.
  - The Markdown report now lists rows excluded from aggregates, pivot-only rows, and medians resting on fewer surviving trials than the run scheduled.

- Updated dependencies [[`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`3044f96`](https://github.com/codefastlabs/codefast/commit/3044f96c4ea8987e8af8583b3b90e0f5c2021105), [`15b732a`](https://github.com/codefastlabs/codefast/commit/15b732a8ade895dec5df464e9ba30f646e0bf39d), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`2def688`](https://github.com/codefastlabs/codefast/commit/2def688e305eebe7e14af4ae163beec13582aad5), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`d27b76f`](https://github.com/codefastlabs/codefast/commit/d27b76fb14200ae5226ec2a05b77d44ab91b016c), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`0093b99`](https://github.com/codefastlabs/codefast/commit/0093b99ed711ad037b0e98e7343dee89786d328b), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`19199af`](https://github.com/codefastlabs/codefast/commit/19199af174d8971081d1849a36fd9df05c8541ae), [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90), [`de80bad`](https://github.com/codefastlabs/codefast/commit/de80bad63f14afda1bd64a6d247852b24aac8e16), [`864d213`](https://github.com/codefastlabs/codefast/commit/864d213a4253346dae5799ebba06fc2726e933d2), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`d27b76f`](https://github.com/codefastlabs/codefast/commit/d27b76fb14200ae5226ec2a05b77d44ab91b016c), [`4f7a188`](https://github.com/codefastlabs/codefast/commit/4f7a188a5f4a281882606f11ed660aecb9844753), [`ad11507`](https://github.com/codefastlabs/codefast/commit/ad115077e23eaed845abd1f093f32d57f2445a36), [`d27b76f`](https://github.com/codefastlabs/codefast/commit/d27b76fb14200ae5226ec2a05b77d44ab91b016c), [`f9aeeb0`](https://github.com/codefastlabs/codefast/commit/f9aeeb04a271877e47a7fbbfc6d62ae0fe1ad955), [`6a25788`](https://github.com/codefastlabs/codefast/commit/6a25788320c73074c3ae0bb06cf7a70b7800c953), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90), [`a720c62`](https://github.com/codefastlabs/codefast/commit/a720c6297d041ffd2d0bba2e6146af894007a367), [`1241f82`](https://github.com/codefastlabs/codefast/commit/1241f82bdb40613667c781111f2ce20409ddfd89), [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90), [`4ba70d1`](https://github.com/codefastlabs/codefast/commit/4ba70d1724e19580ee93ee392e413c23e669f310), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90), [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90), [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90), [`641e233`](https://github.com/codefastlabs/codefast/commit/641e2338d77fb61be2ca585a5986f34cf32ec746)]:
  - @codefast/benchmark-harness@0.5.0
  - @codefast/di@0.5.0
  - @codefast/benchmark-viewer@0.5.0

## 0.5.0-canary.9

### Patch Changes

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - Fairness fixes from an audit of the di-inversify suite:

  - Scenarios can declare `excludeFromAggregates`: the row still renders, but stays out of every median/geomean, and the report names it. Applied to `circular-dependency-3`, whose two sides never did comparable work per op (codefast throws on the 3rd factory entry; inversify 8.2.3 re-enters the user factory 1413 times before its own error) — it alone carried the `failure` group geomean.
  - The isolated runner's rotation now rotates over the libraries that actually implement each scenario. Rotating the full list and then filtering had left the pivot in the first slot for 3 of every 4 head-to-head rows.
  - Every inversify container now runs `{ jitless: false }`, its fastest documented configuration (codegen resolvers, off by default as a CSP-safe fallback).
  - Re-fixtured `scoped-binding-per-child` (inversify side: per-request child + own singleton bind — its idiom for the same user story; it previously failed its own sanity check and silently dropped out), equalized the `to-self-binding` graph, and hoisted the inversify options literals in `resolution-patterns` to match the codefast side.
  - New `realistic-graph-resolved-root` row binds the shared graph via `toResolved`/`toResolvedValue` — the shape both libraries compile ahead of time, comparing each library's best path.
  - The Markdown report now lists rows excluded from aggregates, pivot-only rows, and medians resting on fewer surviving trials than the run scheduled.

- Updated dependencies [[`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`15b732a`](https://github.com/codefastlabs/codefast/commit/15b732a8ade895dec5df464e9ba30f646e0bf39d), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842), [`641e233`](https://github.com/codefastlabs/codefast/commit/641e2338d77fb61be2ca585a5986f34cf32ec746)]:
  - @codefast/benchmark-harness@0.5.0-canary.9
  - @codefast/di@0.5.0-canary.9
  - @codefast/benchmark-viewer@0.5.0-canary.9

## 0.5.0-canary.8

### Patch Changes

- Updated dependencies [[`3044f96`](https://github.com/codefastlabs/codefast/commit/3044f96c4ea8987e8af8583b3b90e0f5c2021105), [`d27b76f`](https://github.com/codefastlabs/codefast/commit/d27b76fb14200ae5226ec2a05b77d44ab91b016c), [`0093b99`](https://github.com/codefastlabs/codefast/commit/0093b99ed711ad037b0e98e7343dee89786d328b), [`de80bad`](https://github.com/codefastlabs/codefast/commit/de80bad63f14afda1bd64a6d247852b24aac8e16), [`864d213`](https://github.com/codefastlabs/codefast/commit/864d213a4253346dae5799ebba06fc2726e933d2), [`d27b76f`](https://github.com/codefastlabs/codefast/commit/d27b76fb14200ae5226ec2a05b77d44ab91b016c), [`d27b76f`](https://github.com/codefastlabs/codefast/commit/d27b76fb14200ae5226ec2a05b77d44ab91b016c), [`a720c62`](https://github.com/codefastlabs/codefast/commit/a720c6297d041ffd2d0bba2e6146af894007a367), [`1241f82`](https://github.com/codefastlabs/codefast/commit/1241f82bdb40613667c781111f2ce20409ddfd89), [`4ba70d1`](https://github.com/codefastlabs/codefast/commit/4ba70d1724e19580ee93ee392e413c23e669f310)]:
  - @codefast/benchmark-harness@0.5.0-canary.8
  - @codefast/di@0.5.0-canary.8
  - @codefast/benchmark-viewer@0.5.0-canary.8

## 0.5.0-canary.7

### Patch Changes

- Updated dependencies [[`2def688`](https://github.com/codefastlabs/codefast/commit/2def688e305eebe7e14af4ae163beec13582aad5), [`19199af`](https://github.com/codefastlabs/codefast/commit/19199af174d8971081d1849a36fd9df05c8541ae), [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90), [`ad11507`](https://github.com/codefastlabs/codefast/commit/ad115077e23eaed845abd1f093f32d57f2445a36), [`f9aeeb0`](https://github.com/codefastlabs/codefast/commit/f9aeeb04a271877e47a7fbbfc6d62ae0fe1ad955), [`6a25788`](https://github.com/codefastlabs/codefast/commit/6a25788320c73074c3ae0bb06cf7a70b7800c953), [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90), [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90), [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90), [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90), [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90)]:
  - @codefast/di@0.5.0-canary.7
  - @codefast/benchmark-harness@0.5.0-canary.7
  - @codefast/benchmark-viewer@0.5.0-canary.7

## 0.5.0-canary.6

### Patch Changes

- Updated dependencies [[`4f7a188`](https://github.com/codefastlabs/codefast/commit/4f7a188a5f4a281882606f11ed660aecb9844753)]:
  - @codefast/di@0.5.0-canary.6
  - @codefast/benchmark-harness@0.5.0-canary.6
  - @codefast/benchmark-viewer@0.5.0-canary.6

## 1.0.0-canary.7

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@1.0.0-canary.7
  - @codefast/benchmark-viewer@1.0.0-canary.7
  - @codefast/di@1.0.0-canary.7

## 1.0.0-canary.6

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@1.0.0-canary.6
  - @codefast/benchmark-viewer@1.0.0-canary.6
  - @codefast/di@1.0.0-canary.6

## 0.5.0-canary.5

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.5.0-canary.5
  - @codefast/benchmark-viewer@0.5.0-canary.5
  - @codefast/di@0.5.0-canary.5

## 0.5.0-canary.4

### Patch Changes

- Updated dependencies [[`4f7a188`](https://github.com/codefastlabs/codefast/commit/4f7a188a5f4a281882606f11ed660aecb9844753)]:
  - @codefast/di@0.5.0-canary.4
  - @codefast/benchmark-harness@0.5.0-canary.4
  - @codefast/benchmark-viewer@0.5.0-canary.4

## 0.5.0-canary.3

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.5.0-canary.3
  - @codefast/benchmark-viewer@0.5.0-canary.3
  - @codefast/di@0.5.0-canary.3

## 0.5.0-canary.2

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.5.0-canary.2
  - @codefast/benchmark-viewer@0.5.0-canary.2
  - @codefast/di@0.5.0-canary.2

## 0.5.0-canary.1

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.5.0-canary.1
  - @codefast/benchmark-viewer@0.5.0-canary.1
  - @codefast/di@0.5.0-canary.1

## 0.5.0-canary.0

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.5.0-canary.0
  - @codefast/benchmark-viewer@0.5.0-canary.0
  - @codefast/di@0.5.0-canary.0

## 0.4.0

### Patch Changes

- [`f79b333`](https://github.com/codefastlabs/codefast/commit/f79b333d0599c19028f29b9889afcbfb99db91a1) Thanks [@thevuong](https://github.com/thevuong)! - feat(dev): enable source condition for zero-rebuild HMR in apps/docs

- Updated dependencies [[`f680df9`](https://github.com/codefastlabs/codefast/commit/f680df903510b91c35f1c342d79e50c0672a4c19), [`2397801`](https://github.com/codefastlabs/codefast/commit/239780172d7a71c3426382ec66309ec7f39bd883), [`172720f`](https://github.com/codefastlabs/codefast/commit/172720f8e7a7d65d653fb9b20bbb47a770b2f713), [`dd9e844`](https://github.com/codefastlabs/codefast/commit/dd9e844608142792f0f6519d552eb2bcbe6c4bc3), [`e0e4aae`](https://github.com/codefastlabs/codefast/commit/e0e4aaee087057668cd1e2ef4cacc83bc4eb833f), [`f79b333`](https://github.com/codefastlabs/codefast/commit/f79b333d0599c19028f29b9889afcbfb99db91a1), [`ebdf9e3`](https://github.com/codefastlabs/codefast/commit/ebdf9e396d3c3a826f05f278c93d391a0ae5ca45), [`6c3ac44`](https://github.com/codefastlabs/codefast/commit/6c3ac44b7ddb9e5bcf3fbe0757e00ef86f27b513), [`f26e846`](https://github.com/codefastlabs/codefast/commit/f26e8460e982171bfde13a7bd3fab4543e933df4), [`8fc1299`](https://github.com/codefastlabs/codefast/commit/8fc129956d353e1e31a2c1a364792484a85a53a1)]:
  - @codefast/benchmark-harness@0.4.0
  - @codefast/benchmark-viewer@0.4.0
  - @codefast/di@0.4.0

## 0.4.0-canary.6

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.4.0-canary.6
  - @codefast/benchmark-viewer@0.4.0-canary.6
  - @codefast/di@0.4.0-canary.6

## 0.4.0-canary.5

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.4.0-canary.5
  - @codefast/benchmark-viewer@0.4.0-canary.5
  - @codefast/di@0.4.0-canary.5

## 0.4.0-canary.4

### Patch Changes

- Updated dependencies [[`7b4e2fd`](https://github.com/codefastlabs/codefast/commit/7b4e2fde5a76fd4452e17b2aff5b94f7d669722b), [`a66946d`](https://github.com/codefastlabs/codefast/commit/a66946d7b4f249927caea567232a9c05cd861020), [`fa338d6`](https://github.com/codefastlabs/codefast/commit/fa338d61fbfafb94beaa4d05d93d01e2c005cc91)]:
  - @codefast/benchmark-harness@0.4.0-canary.4
  - @codefast/benchmark-viewer@0.4.0-canary.4
  - @codefast/di@0.4.0-canary.4

## 0.3.16-canary.3

### Patch Changes

- [`2a82188`](https://github.com/codefastlabs/codefast/commit/2a82188264c204b0b519b3324402ae962594d29b) Thanks [@thevuong](https://github.com/thevuong)! - feat(dev): enable source condition for zero-rebuild HMR in apps/docs

- Updated dependencies [[`6149d30`](https://github.com/codefastlabs/codefast/commit/6149d30a3c20f1f4324b140525b6374a935aaabd), [`2a82188`](https://github.com/codefastlabs/codefast/commit/2a82188264c204b0b519b3324402ae962594d29b), [`bed2f30`](https://github.com/codefastlabs/codefast/commit/bed2f30df74128fe3b1a98dd9d03f6bb96099164)]:
  - @codefast/benchmark-viewer@0.3.16-canary.3
  - @codefast/benchmark-harness@0.3.16-canary.3
  - @codefast/di@0.3.16-canary.3

## 0.3.16-canary.2

### Patch Changes

- Updated dependencies [[`1ad2cb7`](https://github.com/codefastlabs/codefast/commit/1ad2cb73a3f6f8bff2b001e9df2f2492efd89aa2), [`4fda78b`](https://github.com/codefastlabs/codefast/commit/4fda78b20f98646d114cfddb09e66af609a625a2), [`3620966`](https://github.com/codefastlabs/codefast/commit/36209662115718c1d86566d36df991e98e1c36ab), [`1b0df2e`](https://github.com/codefastlabs/codefast/commit/1b0df2e55140c927b7f3ba39ccdcb4cba87ec7ff)]:
  - @codefast/benchmark-harness@0.3.16-canary.2
  - @codefast/di@0.3.16-canary.2

## 0.3.16-canary.1

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.3.16-canary.1
  - @codefast/di@0.3.16-canary.1

## 0.3.16-canary.0

### Patch Changes

- Updated dependencies []:
  - @codefast/benchmark-harness@0.3.16-canary.0
  - @codefast/di@0.3.16-canary.0

## 0.3.15

### Patch Changes

- Updated dependencies [[`8492085`](https://github.com/codefastlabs/codefast/commit/849208521571b18a3af1f36566c3111a5af01b7c), [`4df6e65`](https://github.com/codefastlabs/codefast/commit/4df6e6579faf21c6dc7622eb424ad213b120dabb)]:
  - @codefast/di@0.3.15
  - @codefast/benchmark-harness@0.3.15
