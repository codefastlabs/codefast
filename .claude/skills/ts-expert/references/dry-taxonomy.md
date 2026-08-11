# DRY audit (TypeScript-specific)

DRY in TypeScript has three distinct layers. Audit all three — a codebase can be spotless at the code level and drifting
badly at the type level.

## Layer 1 — Type-level

- **1.1 Duplicated type shapes ("type drift")** — hand-written types that should be derived: `Partial<>`, `Readonly<>`,
  `Required<>`, `Pick<>`, `Omit<>`, `Exclude<>`, `Extract<>`, mapped types.
- **1.2 Detached return types** — re-declared instead of `ReturnType<typeof fn>` / `Awaited<ReturnType<…>>` /
  `Parameters<>` / `ConstructorParameters<>`.
- **1.3 Repeated generic constraints** — the same `<Value extends {…}>` across functions → extract a named type.
- **1.4 Magic strings** — a literal compared in many places alongside a parallel hand-written union →
  `const X = {…} as const; type X = (typeof X)[keyof typeof X]`.
- **1.5 Schema + type duplication** (Zod / Valibot / Arktype) — the shape defined twice → `z.infer<typeof schema>`.
- **1.6 Unused template literal types** — hand-listed `'GET /users'` etc. → compose from `Method` × `Resource`.
- **1.7 Unused mapped types** — parallel variants (`FormErrors`, `FormTouched`) → `{ [K in keyof Value]: … }`.

## Layer 2 — Code-level

- **2.1** Duplicated guard clauses → a typed assertion (`asserts x is Target`).
- **2.2** Repeated try/catch sharing one transform, more than twice → `withErrorHandling<Value>()` returning a `Result`.
- **2.3** The same map/filter/reduce pipeline duplicated → extract it.
- **2.4** Repeated `switch` / if-else dispatch → a `Record<Status, Handler>` lookup, exhaustive by type.
- **2.5** Identical class boilerplate → a base class or mixin.

## Layer 3 — Structural

- **3.1** A barrel re-exporting types and values together → split `types.ts` (`export type`) from `index.ts`.
- **3.2** Duplicated test mocks/fixtures → shared helpers under `tests/<category>/support/**` or
  `tests/<category>/fixtures/**`, mirroring the `src/` path. Never under `src/**`, never directly under `tests/`, and
  the filename must not match `*.test.*` or Vitest will not discover the suite.
- **3.3** Repeated config objects → `const DEFAULT_CONFIG = {…} as const` plus spread overrides. This covers tsconfig
  flags copy-pasted across workspaces, which is the most common instance in this repo and the one that silently excludes
  whichever package nobody edited.

## Closing the DRY pass

Report violations per layer, then the top three sources of drift — the places most likely to be copy-pasted next — with
a one-line reason each. Skip the overall "maintenance debt: HIGH/MEDIUM/LOW" verdict; it carries no information the
per-layer findings don't already give.
