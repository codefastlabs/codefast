---
"@codefast/di-testing": minor
---

Add `@codefast/di-testing`: solitary auto-mocking test beds for `@codefast/di`. `TestBed.solitary(Class)` reads a
class's declared dependencies through di's `MetadataReader`, builds a mock for each, and constructs the real unit
through a container so `@postConstruct`, accessor injection, and `@preDestroy` run as in production. The default mock is
a zero-dependency spy; pass `mockFactory: () => vi.fn()` to build the mocks from Vitest, Jest, or Sinon instead.
