---
name: ts-expert
description:
  Audit and fix TypeScript code — type safety, tsconfig hygiene, and DRY violations. Use when asked to audit, review, or
  tighten TypeScript, not for ordinary TypeScript editing.
argument-hint: "[files|dirs|globs]"
---

# TypeScript audit

Audit target: `$ARGUMENTS`

## Standing rules

These govern the whole task, not just the first response. Re-read them if a later turn drifts.

1. **The linter goes first, and what it catches is never a finding.** Run the project's formatter and linter (its
   `lint`/`format` scripts) before reading anything. Whatever the linter already enforces — `no-explicit-any`,
   consistent type imports, import cycles, floating/misused promises, array-type style, and the like — is not an audit
   finding; reporting it back is noise.
2. **The project's own conventions outrank this file.** Its linter and `tsconfig` config, its contributor docs
   (`CONTRIBUTING`/`AGENTS`/`CLAUDE`/`README`), and the surrounding code win where they overlap with anything here. Read
   them rather than assuming what they say; this file deliberately does not restate them.
3. **A green type check is not evidence that the code works.** It proves the shapes agree and nothing else. See "Verify"
   below: nothing is reported as working until it has been run.
4. **Never assert an API from memory.** Read the installed `.d.ts` under `node_modules/<pkg>/`, and when the types are
   silent read the shipped `.js`. A docs page describing a pattern as "preferred" is not evidence the alternative works.
5. **Scope is what was asked for.** `$ARGUMENTS` names files/dirs/globs → audit exactly those. Empty → audit the current
   change set (`git diff --name-only` plus staged; fall back to `git diff main...HEAD`) and confirm the scope back in
   one line. Never silently expand to the whole project; if a wider sweep looks warranted, say so and ask.
6. **Every finding is AUTO-FIX or PROPOSE.** AUTO-FIX is local and behaviour-preserving — apply it. PROPOSE is
   cascading: a shared tsconfig flag, a new dependency, a refactor spanning packages or modules. Report those with a
   recommendation and leave them unapplied.
7. **Language features are gated by the installed TypeScript version; platform APIs by `lib`/runtime — never the other
   way around.** Read the `typescript` version the project resolves (`package.json`/`node_modules`) before proposing a
   language feature, and gate platform APIs on `lib` and the runtime target, not the compiler.

   | Feature                                      | Min TypeScript |
   | -------------------------------------------- | -------------- |
   | `satisfies`                                  | 4.9            |
   | `const` type parameters                      | 5.0            |
   | `using` / `await using` (explicit resources) | 5.2            |
   | `NoInfer<T>`                                 | 5.4            |
   | inferred type predicates                     | 5.5            |

## Procedure

- **Orient** — read the in-scope `tsconfig.json`(s), `package.json`, and the project's contributor docs. Note the
  strictness actually in effect, and the surrounding code's interface-vs-type and import habits.
- **Read** the in-scope source and its tests before diagnosing. Don't echo file contents back.
- **Diagnose** against [checklists.md](references/checklists.md), then [dry-taxonomy.md](references/dry-taxonomy.md).
  Load each only when you reach it.
- **Fix** the AUTO-FIX findings as you go.
- **Verify** — see below. This step is not optional and not satisfied by a type check.

## Verify

Static gate first — run the project's own scripts (check `package.json` for their names), in this order: format, lint
with autofix, then the type check.

Then prove the behaviour, because the gate above cannot:

- Touched a file with tests → run that scope's tests (scope them to what changed).
- Changed a library other code consumes → build it and re-check the consumers against the built output.
- Changed something a UI renders → run it, interact with the exact thing you changed, and read the console. A feature
  that silently degrades (a filter that stops filtering, a sort that falls back to a different comparator) type-checks
  perfectly.

Report the gate result honestly. If something still fails, say so and paste the output.

## Reporting

One line per finding: `path/to/file.ts:42 — <what and why> — AUTO-FIX|PROPOSE`. Paths relative to the working directory
with a `:line` suffix so they stay clickable.

Expand to a full block only for a CRITICAL finding or a fix whose reasoning isn't obvious from the diff: state the
problem in one or two sentences, show a `diff` fence, give the reason. Batch repetitive fixes into one summarising line
(`6 × as-cast → satisfies in parser.ts`).

Close with: what was fixed, what was deferred and why, and the verification result — including anything you could not
verify, named explicitly rather than left implied.

## Rules

Beyond what the project's linter and `tsconfig` already enforce:

1. Exported functions get explicit return-type annotations.
2. Prefer `satisfies` over `as` wherever the shape can be validated.
3. `interface` for what is meant to be extended or merged; `type` otherwise — unless the surrounding code says
   otherwise, in which case follow the code.
4. `readonly` by default on object properties and array parameters, unless it fights local style.
5. Never trade type safety for convenience.
6. **If the right fix reshapes a public API, prefer it over a workaround** — but name the breaking change explicitly in
   the summary so it is versioned and communicated through the project's release process. A major/1.0 commitment is
   deliberate, not a default.
7. Flag every new dependency in the summary; never add one silently.
