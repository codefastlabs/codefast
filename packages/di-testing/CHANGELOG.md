# @codefast/di-testing

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
