---
name: pnpm-deps-update-safe
description: >
  Use when the user asks to upgrade, bump, or refresh npm dependencies in the
  codefast monorepo — specifically via pnpm deps:update, deps:update:interactive,
  or deps:outdated. Do NOT trigger for general `pnpm install`, lockfile-only fixes,
  or unrelated pnpm errors.
---

# Safe `pnpm deps:update` (codefast monorepo)

## What the scripts do

| Script                         | Command                        | Notes                                                                                                                                 |
| ------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm deps:outdated`           | `pnpm outdated`                | Preview only — no changes. Output columns: Current / Wanted / Latest                                                                  |
| `pnpm deps:update`             | `pnpm up --latest --recursive` | Bumps all packages to latest across the workspace; updates `catalog:` entries in `pnpm-workspace.yaml` and child `package.json` files |
| `pnpm deps:update:interactive` | Same with `--interactive`      | Pick packages one-by-one — prefer for large major jumps or minimal blast radius                                                       |

**Repo facts**

- **Catalog mode**: `strict` — every `catalog:` reference in any `package.json` must resolve to an entry in `pnpm-workspace.yaml`. Ad-hoc version strings in child packages where `catalog:` is expected will break resolution.
- **Quality gate**: `pnpm check` — runs `turbo run lint format:check check-types` (no bundled `quality` task; lint, format check, and types are separate Turbo tasks).
- **Runtime**: Node `>=24`. pnpm version pinned in root `packageManager` field.

> **Pre-flight check**: Before running any step, verify:
>
> ```
> node --version   # must satisfy >=24
> pnpm --version   # must match root package.json `packageManager`
> ```
>
> Version mismatches cause silent catalog resolution differences.

---

## Workflow (execute in order)

### 1. Branch

```bash
git checkout -b chore/deps-<date-or-scope>
```

Working tree must be clean before starting. Confirm with `git status`.

### 2. Baseline (optional but recommended)

```bash
pnpm deps:outdated
```

Note packages with **major** version jumps — these are the highest-risk items.
Flag fragile stacks early: framework (e.g. React, Next), compiler (TypeScript), test runner (Vitest).

### 3. Upgrade — choose one strategy

| Situation                                      | Command                                                  |
| ---------------------------------------------- | -------------------------------------------------------- |
| Routine bump, no known breaking changes        | `pnpm deps:update`                                       |
| One or more major jumps, or user wants control | `pnpm deps:update:interactive`                           |
| Scoped to specific packages                    | `pnpm deps:update:interactive`, deselect everything else |

For interactive mode, prefer upgrading in thematic batches (e.g. tooling first, then runtime deps) and running verify after each batch.

### 4. Install

```bash
pnpm install
```

Run unconditionally after step 3. If pnpm reports `"lockfile is not up-to-date"` or peer warnings persist after install, re-run once more before continuing.

### 5. Review diff

Inspect changes to these files — in this order:

1. **`pnpm-workspace.yaml`** (`catalog:` block) — source of truth for all shared versions. Every major jump here needs attention.
2. **`apps/*/package.json`, `packages/*/package.json`, `benchmarks/*/package.json`** — confirm no ad-hoc version strings were introduced; all shared deps must use `catalog:`.
3. **`pnpm-lock.yaml`** — sanity-check that resolved versions match catalog entries.
4. **Root `package.json`** `overrides` / `peerDependencyRules` — flag any unintended widening.

> ⚠️ **Action trigger**: For each `catalog:` entry that jumped a major version, check whether a corresponding code fix exists. A major bump with no code change is a strong signal the fix is missing — do not proceed past step 6 until resolved or intentionally pinned.

### 6. Verify — all three must pass

Run in this order (matches `.github/workflows/reusable-verify-packages.yml`: build before `pnpm check` so type-aware oxlint sees built package typings):

```bash
pnpm build   # packages/apps — needed before lint/types gate in this repo
pnpm check   # lint + format check + check-types (via turbo)
pnpm test
```

Do not mark the upgrade done until all three pass cleanly.

### 7. Commit

```bash
git add pnpm-workspace.yaml pnpm-lock.yaml apps/ packages/ benchmarks/
git commit -m "chore(deps): bump dependencies $(date +%Y-%m-%d)"
```

Mention major version jumps and any manual fixes in the commit body.

---

## When something fails

### Peer / catalog errors

1. Read pnpm output carefully — it usually names the conflicting package and expected range.
2. Adjust the **catalog entry** in `pnpm-workspace.yaml` first.
3. Only add/widen root `overrides` or `peerDependencyRules` when truly necessary — document why in a comment.
4. Re-run `pnpm install` and verify again.

### Type or test failures after a major bump

1. Check the package's GitHub releases / changelog for the version you jumped to.
2. Fix callsites in code, or pin a compatible version **in the catalog** (not in child `package.json`).
3. If the fix is non-trivial, consider reverting just that package and filing a follow-up task.

### Partial success / rollback

```bash
# Revert manifests and lockfile, keep branch
git checkout -- pnpm-workspace.yaml pnpm-lock.yaml apps/ packages/ benchmarks/
pnpm install
```

Then switch to `deps:update:interactive` and upgrade in smaller batches, running verify after each.

---

## Anti-patterns — never do these

- **Upgrading on `main`** without a branch and without running the full verify sequence.
- **Manually editing `pnpm-lock.yaml`** — always let pnpm regenerate it.
- **Ad-hoc version strings in child `package.json`** — e.g. `"react": "^19.0.0"` in `apps/web/package.json` instead of using `catalog:` and updating the catalog. This breaks strict catalogMode.
- **Skipping `pnpm-workspace.yaml` review** after a recursive update — the catalog is the single source of truth for shared versions.
- **Widening `peerDependencyRules`** without a documented reason — masks real incompatibilities.

---

## Summary (always emit at end of task)

After finishing, report:

1. **Major version jumps** — list each package and old → new version.
2. **Manual interventions** — overrides, peer rules, code fixes applied.
3. **Verify results** — confirm `check`, `build`, and `test` all passed (or note which failed and why).
