---
name: typescript
description:
  Expert-grade TypeScript from the first draft — type safety, API shape, tsconfig hygiene, and DRY across types, code,
  and structure. Use whenever writing, editing, or reviewing TypeScript, not only when asked to audit — the rules shape
  the first draft, so code never needs a basic-to-expert cleanup pass. When asked to audit, review, or tighten
  TypeScript, run the full audit procedure over the named files.
argument-hint: "[files|dirs|globs]"
---

# TypeScript

TypeScript here is expert-grade on the first pass. This file holds only what a strong model does not do unprompted: the
traps that compile cleanly, the discipline around breaking and behaviour-changing edits, and which reference to load
when. It runs in **Write** mode for any TypeScript edit, and in **Audit** mode when asked to audit, review, or tighten
TypeScript, or when invoked with a target.

## Rules for both modes

1. **The project's conventions outrank this file** — its linter, tsconfig, contributor docs, and surrounding code.
2. **Ground every feature in the installed version.** Read the TypeScript version the project resolves and the installed
   `.d.ts` before relying on a feature or API. Platform APIs are gated by `lib` and the runtime, not the compiler.

   | Feature or flag                              | Min TypeScript |
   | -------------------------------------------- | -------------- |
   | `in` / `out` variance annotations            | 4.7            |
   | `satisfies`                                  | 4.9            |
   | `const` type parameters                      | 5.0            |
   | `using` / `await using` (explicit resources) | 5.2            |
   | `NoInfer<T>`                                 | 5.4            |
   | inferred type predicates                     | 5.5            |
   | `isolatedDeclarations`                       | 5.5            |
   | `erasableSyntaxOnly`                         | 5.8            |

3. **Cascading changes are proposed, never slipped in** — a shared tsconfig flag, a new dependency, a refactor spanning
   packages or modules.
4. **Name every breaking change.** An edit that makes an exported declaration reject code it used to accept is breaking,
   even when that code was unsound. Prefer the right reshape over a workaround, and say that it breaks; a 1.0 is
   deliberate, not a default.
5. **A green type check proves only that the shapes agree.** Run the behaviour you changed. An exported generic type
   also gets type tests that show what it rejects, and a library other code consumes is built and re-checked against its
   consumers.

## References

Each is self-contained; load one only when its trigger applies, since an unneeded one is context spent for nothing.

| Reference                                   | Load when                                                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [type-design.md](references/type-design.md) | writing a module, a public API, or a shared type; every audit                                     |
| [public-api.md](references/public-api.md)   | adding to or changing what a package exports, including its type tests                            |
| [tsconfig.md](references/tsconfig.md)       | touching a tsconfig or `lib`, reaching for a newer platform API, or auditing more than one config |
| [dry.md](references/dry.md)                 | a second copy of a type or block appears; the DRY pass of an audit                                |

## Audit

Audit target: `$ARGUMENTS` — exactly those files. Empty means the current change set (`git diff --name-only` plus
staged, falling back to `git diff main...HEAD`), confirmed back in one line. Ask before widening the scope.

1. **Run the linter first; whatever it enforces is never a finding.**
2. **Every finding is AUTO-FIX or PROPOSE.** AUTO-FIX is local and keeps behaviour for every input the types admit —
   apply it. Input the types do not admit still reaches the code from JavaScript callers and parsed data: a fix may
   change what happens to it only when closing that gap is the fix itself (validating untrusted JSON, removing a cast
   that lies), and the report names each such change. Any other behaviour change, or a cascading one, is PROPOSE —
   report it with a recommendation and leave it unapplied.
3. **Report one line per finding** — `path/to/file.ts:42 — <what and why> — AUTO-FIX|PROPOSE` — batching repeats
   (`6 × as-cast → satisfies in parser.ts`). Close with what was fixed, what was proposed and why, every behaviour
   change the applied fixes make, and the verification result, naming anything not verified.
