# @codefast/di-testing

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
