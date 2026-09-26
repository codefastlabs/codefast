# @codefast/di-testing

## 0.2.0

### Minor Changes

- [#952](https://github.com/codefastlabs/codefast/pull/952) A suite now states its mock backend once, and a test bed can no longer be typed against one backend and built from
  another. `createTestBed({ mockFactory, metadataReader? })` returns the entry point every bed begins from, its `Backend`
  inferred from the factory; `TestBed.solitary(target)` and `TestBed.sociable(target)` take the target only. The `TestBed`
  export is `createTestBed({ mockFactory: defaultMockFactory })`, the built-in spy with no framework needed.

  Before, the backend was chosen per call — `TestBed.solitary(Unit, { mockFactory: () => vi.fn() })` — and
  `TestBed.solitary<Unit, SinonStub>(Unit)` with no factory type-checked, typed every mock as `SinonStub`, and built the
  default spy. Migrate by creating the suite's entry point once:

  ```ts
  import { createTestBed } from "@codefast/di-testing";
  import { vi } from "vitest";

  export const TestBed = createTestBed({ mockFactory: () => vi.fn() });
  ```

  `TestBedOptions<Backend>` configures `createTestBed` and requires `mockFactory`; `TestBedStatic<Backend>` names the
  entry point's backend and has no default. `createTestBed` throws the new `MissingMockFactoryError`
  (`MISSING_MOCK_FACTORY`) for a caller past the types who passes no factory, instead of standing the built-in spy in for
  a backend nobody chose.

- [#976](https://github.com/codefastlabs/codefast/pull/976) `engines.node` is now `>=24.0.0`, up from `>=22.12.0`, and Node 22 is no longer supported. Node 24.0.0 is the first
  release with explicit resource management built in (`using`, `await using`, `DisposableStack`, `AsyncDisposableStack`,
  `SuppressedError`) and all of ES2025, so the packages use both as the platform ships them instead of shimming them for
  an older line, and the CI matrix runs the unit suite on 24.0.0 itself. Move to Node 24, or stay on the current minor
  while a deployment still runs Node 22.

### Patch Changes

- [#976](https://github.com/codefastlabs/codefast/pull/976) The README states what a program needs for the declarations' disposal members: the explicit resource management types,
  which no numbered `lib` declares before ES2027. `@types/node` 24 or later loads them, and so does `ESNext.Disposable` in
  `lib`. Without either, TypeScript 7 fails inside `container.d.ts` with TS2550 under `skipLibCheck: false`, and at
  `await using` with TS2318. `@codefast/di-testing` drops a `/// <reference lib="esnext.disposable" />` that TypeScript 7
  stripped from its emitted declarations anyway, and takes the lib from its `tsconfig.json` instead.

- [#956](https://github.com/codefastlabs/codefast/pull/956) `README.md` no longer quotes the `@codefast/di` peer range, which had fallen behind `package.json` — the release tooling
  moves that range, so the manifest is the one place it is stated.

- [#965](https://github.com/codefastlabs/codefast/pull/965) `README.md` now states TypeScript 7 or later as the floor for the package's types — the one compiler every `@codefast/*`
  package is built and checked with. No code or declaration changed.
- Updated dependencies:
  - @codefast/di@0.11.0

## 0.1.4

### Patch Changes

- [#892](https://github.com/codefastlabs/codefast/pull/892) [`4c97c5b`](https://github.com/codefastlabs/codefast/commit/4c97c5b8c2314f25ee9df7eac5a4b5dd723d6d90) Thanks [@thevuong](https://github.com/thevuong)! - Lower the monorepo's Node floor from 24 to 22.12, so the packages install and run on the active Node 22 LTS line.

  `engines.node` becomes `>=22.12.0` across every package — the floor the shared toolchain (oxlint, Vite, Vitest, TanStack
  Start) already requires. Development stays on the latest Node (`.node-version`) for speed, and a CI matrix exercises the
  floor and the active LTS directly, so the floor is a contract CI proves rather than one everyone has to run.
  `@types/node` is pinned to the floor's major (`^22`), with a workspace override holding the whole tree there so a dev
  tool's `@types/node: "*"` peer can no longer pull a newer major and mask an API the floor lacks. The floor stays
  mechanical, not advisory: `@codefast/di` keeps its own `Map` upsert helpers rather than the ES2025
  `Map.prototype.getOrInsert` (which would raise the floor to 26) and its `lib` stays `ES2024`. `@codefast/cli`'s mirror
  step now calls the `node:path` functions directly instead of aliasing them, which the floor's types correctly flag as
  unbound methods.

  The shared `@codefast/typescript-config` presets pin `lib` and `target` to `ES2024` (was `ESNext`) so the compiler's
  ECMAScript surface matches the Node floor: an ES2025 builtin such as `Map.prototype.getOrInsert` now fails to type-check
  rather than compiling and crashing on Node 22.12. `@codefast/di` and `@codefast/di-testing` already pinned `lib` and are
  unchanged.

  Internal subpath imports move from a `#/` prefix to a bare `#` (`#core/token`, not `#/core/token`), and the
  `package.json#imports` keys become `#*`/`#tests/*`/`#examples/*` to match. Node's native ESM resolver rejects a
  `#/`-prefixed specifier with `ERR_INVALID_MODULE_SPECIFIER` on the whole Node 22 line (and on Node 24 before 24.14), and
  each package ships those specifiers verbatim inside its published `dist/*.js` for a consumer's Node to resolve — so this
  rename is what actually lets the packages import on the new floor. Purely internal: a consumer's own import paths are
  unchanged.

- Updated dependencies [[`4c97c5b`](https://github.com/codefastlabs/codefast/commit/4c97c5b8c2314f25ee9df7eac5a4b5dd723d6d90)]:
  - @codefast/di@0.10.1

## 0.1.3

### Patch Changes

- [#827](https://github.com/codefastlabs/codefast/pull/827) [`0984174`](https://github.com/codefastlabs/codefast/commit/0984174df148a7cffcd09b837bdde1922f38f24e) Thanks [@thevuong](https://github.com/thevuong)! - `package.json` now carries `homepage` and `bugs`, so npm links the package README and the issue tracker the way the
  other `@codefast/*` packages already do.

- [#848](https://github.com/codefastlabs/codefast/pull/848) [`ffb61a0`](https://github.com/codefastlabs/codefast/commit/ffb61a094aefb77d68dd13af7dba96ffdee6f5f2) Thanks [@thevuong](https://github.com/thevuong)! - README samples declare tokens with a `<namespace>:<Name>` display name, matching the convention `@codefast/di`
  documents.
- Updated dependencies [[`0984174`](https://github.com/codefastlabs/codefast/commit/0984174df148a7cffcd09b837bdde1922f38f24e), [`d0b794c`](https://github.com/codefastlabs/codefast/commit/d0b794c047344c4040b5641202c259d72a0ea48c)]:
  - @codefast/di@0.9.0

## 0.1.2

### Patch Changes

- [#791](https://github.com/codefastlabs/codefast/pull/791) [`37a212b`](https://github.com/codefastlabs/codefast/commit/37a212b4d805588413159e11e872b98db82326bf) Thanks [@thevuong](https://github.com/thevuong)! - Point the README's license badge and "License" section at the package's own `LICENSE` file instead of the monorepo root.

- [#796](https://github.com/codefastlabs/codefast/pull/796) [`ba04d27`](https://github.com/codefastlabs/codefast/commit/ba04d2703c59a1677f52e6a9fffd0ec202328218) Thanks [@thevuong](https://github.com/thevuong)! - Rewrite the README around one structure — what the package is, installation and requirements, a complete quick start,
  the concepts in learning order, then the documents and the license — with every API claim checked against the current
  code and no figures that go stale.

- [#784](https://github.com/codefastlabs/codefast/pull/784) [`ad2f93a`](https://github.com/codefastlabs/codefast/commit/ad2f93a688e99c3ed8be6ceeae9d6cdd6be861bc) Thanks [@thevuong](https://github.com/thevuong)! - Ship the MIT `LICENSE` file in the published package. `files` already listed it, but the file was missing from the
  package directory, so the tarball had none.
- Updated dependencies [[`37a212b`](https://github.com/codefastlabs/codefast/commit/37a212b4d805588413159e11e872b98db82326bf), [`ba04d27`](https://github.com/codefastlabs/codefast/commit/ba04d2703c59a1677f52e6a9fffd0ec202328218), [`ad2f93a`](https://github.com/codefastlabs/codefast/commit/ad2f93a688e99c3ed8be6ceeae9d6cdd6be861bc)]:
  - @codefast/di@0.8.1

## 0.1.1

### Patch Changes

- [#774](https://github.com/codefastlabs/codefast/pull/774) [`176e95a`](https://github.com/codefastlabs/codefast/commit/176e95a32b44fa16d81a22e4a48f53176837c839) Thanks [@thevuong](https://github.com/thevuong)! - Fold di's reserved `slotName` criterion into slot addressing, so `{ name: "x" }` and `{ tag: slotName.of("x") }` — one
  slot to the container — are one slot to TestBed too: a mock registered with either spelling now matches a dependency
  declared with the other, and `mocks.get(token, options)` accepts both.
- Updated dependencies [[`96af502`](https://github.com/codefastlabs/codefast/commit/96af502ed8dd7fc02c4440d03b40dc6677b7bcec)]:
  - @codefast/di@0.8.0

## 0.1.0

### Minor Changes

- [#771](https://github.com/codefastlabs/codefast/pull/771) [`33c19b7`](https://github.com/codefastlabs/codefast/commit/33c19b73bf97dfe4388124f139552a3d63fcd87b) Thanks [@thevuong](https://github.com/thevuong)! - Add `@codefast/di-testing`: solitary and sociable auto-mocking test beds for `@codefast/di`. `TestBed.solitary(Class)`
  reads a class's declared dependencies through di's `MetadataReader`, builds a mock for each, and constructs the real
  unit through a container so `@postConstruct`, accessor injection, and `@preDestroy` run as in production. The default
  mock is a zero-dependency spy; pass `mockFactory: () => vi.fn()` to build the mocks from Vitest, Jest, or Sinon — the
  factory's return type flows through the bed, so each backend's own mock API type-checks on `mocks.get(...)` and inside
  `.stub` callbacks with no adapter packages. Overrides cover fixed sealed values (`.using`), partial stubs (`.stub`),
  absent optionals (`.absent`), `injectAll` element lists (`.usingAll`), and slot-targeted mocks
  (`.mock(token, { name })`); beds expose `resetMocks()` and `await using` disposal.
  `TestBed.sociable(Class).expose(Collaborator)` keeps chosen class-keyed collaborators real (recursively, lifecycle
  included) while token-keyed dependencies stay mocked as the declared boundary; `bed.exposed(Class)` retrieves the real
  instances.
