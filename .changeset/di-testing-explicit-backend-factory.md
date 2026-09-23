---
"@codefast/di-testing": minor
---

A suite now states its mock backend once, and a test bed can no longer be typed against one backend and built from
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
