---
name: ts-expert
description: Audit and fix TypeScript code — type safety, tsconfig hygiene, and DRY violations. Use when asked to audit, review, or tighten TypeScript, not for ordinary TypeScript editing.
argument-hint: "[files|dirs|globs]"
allowed-tools:
  - Bash(pnpm run format)
  - Bash(pnpm run lint:fix)
  - Bash(pnpm run check-types)
  - Bash(pnpm run test:unit*)
  - Bash(pnpm --filter * test:unit*)
  - Bash(pnpm run build:packages)
---

# TypeScript audit

Audit target: `$ARGUMENTS`

## Standing rules

These govern the whole task, not just the first response. Re-read them if a later turn drifts.

1. **The linter goes first, and what it catches is never a finding.** Run `pnpm run lint:fix`
   before reading anything. `oxlint` runs under `denyWarnings` and already enforces
   `no-explicit-any`, `consistent-type-imports`, `import/no-cycle`, `no-floating-promises`,
   `no-misused-promises` and `array-type`. Reporting those back is noise.
2. **CLAUDE.md and `oxlint.config.ts` outrank this file.** Where they overlap, they win, and this
   file deliberately does not restate them — read them rather than assuming what they say.
3. **A green `check-types` is not evidence that the code works.** It proves the shapes agree and
   nothing else. See "Verify" below: nothing is reported as working until it has been run.
4. **Never assert an API from memory.** Read the installed `.d.ts` under
   `node_modules/.pnpm/<pkg>@<version>/`, and when the types are silent read the shipped `.js`.
   A docs page describing a pattern as "preferred" is not evidence the alternative works.
5. **Scope is what was asked for.** `$ARGUMENTS` names files/dirs/globs → audit exactly those.
   Empty → audit the current change set (`git diff --name-only` plus staged; fall back to
   `git diff main...HEAD`) and confirm the scope back in one line. Never silently expand to the
   whole monorepo; if a wider sweep looks warranted, say so and ask.
6. **Every finding is AUTO-FIX or PROPOSE.** AUTO-FIX is local and behaviour-preserving — apply
   it. PROPOSE is cascading: a shared tsconfig flag, a new dependency, a refactor spanning
   workspaces. Report those with a recommendation and leave them unapplied.
7. **TypeScript is pinned at 7.x**, so every 5.x-era feature (`satisfies`, `const` type
   parameters, `NoInfer`, inferred type predicates, `using`) is unconditionally available. Gate
   only on `lib`/runtime for platform APIs, never on the compiler version.

## Procedure

- **Orient** — read the in-scope `tsconfig.json`(s), `package.json`, and `CLAUDE.md`. Note the
  strictness actually in effect, and the surrounding code's interface-vs-type and import habits.
- **Read** the in-scope source and its tests before diagnosing. Don't echo file contents back.
- **Diagnose** against [checklists.md](references/checklists.md), then
  [dry-taxonomy.md](references/dry-taxonomy.md). Load each only when you reach it.
- **Fix** the AUTO-FIX findings as you go.
- **Verify** — see below. This step is not optional and not satisfied by a type check.

## Verify

Static gate first, in this order:

```bash
pnpm run format
pnpm run lint:fix
pnpm run check-types
```

Then prove the behaviour, because the gate above cannot:

- Touched a file with tests → `pnpm run test:unit`, scoped with `--filter`.
- Changed `packages/*` → `pnpm run build:packages`, and re-check the consumers.
- Changed something a browser renders → start the preview, interact with the thing you changed,
  and read the console. A feature that silently degrades (a filter that stops filtering, a sort
  that falls back to a different comparator) type-checks perfectly.
- Changed `apps/ui` → `pnpm --filter @apps/ui build`. Dev hides client import-protection errors
  and build-time prerender failures.

Report the gate result honestly. If something still fails, say so and paste the output.

## Reporting

One line per finding: `path/to/file.ts:42 — <what and why> — AUTO-FIX|PROPOSE`. Paths relative to
the working directory with a `:line` suffix so they stay clickable.

Expand to a full block only for a CRITICAL finding or a fix whose reasoning isn't obvious from the
diff: state the problem in one or two sentences, show a `diff` fence, give the reason. Batch
repetitive fixes into one summarising line (`6 × as-cast → satisfies in parser.ts`).

Close with: what was fixed, what was deferred and why, and the verification result — including
anything you could not verify, named explicitly rather than left implied.

## Rules

Beyond what CLAUDE.md and `oxlint.config.ts` already enforce:

1. Exported functions get explicit return-type annotations.
2. Prefer `satisfies` over `as` wherever the shape can be validated.
3. `interface` for what is meant to be extended or merged; `type` otherwise — unless the
   surrounding code says otherwise, in which case follow the code.
4. `readonly` by default on object properties and array parameters, unless it fights local style.
5. Never trade type safety for convenience.
6. **Breaking changes are cheap here — reshape a public API when that is the right fix.** The
   `@codefast/*` group is pinned at 0.x with no planned 1.0, and a breaking change ships as a
   `minor`. Still name it in the summary so a changeset gets written; never author a `major`.
7. Flag every new npm dependency in the summary; never add one silently.
