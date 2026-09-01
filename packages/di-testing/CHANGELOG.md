# @codefast/di-testing

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
