---
name: pnpm-migrate
description: Performs cautious dependency migration in pnpm projects after outdated checks by triaging risk, updating incrementally, validating after each change, and documenting outcomes. Use when the user asks to migrate outdated dependencies, do step-by-step package updates, handle major-version upgrades, or run safe dependency refresh in a pnpm monorepo.
---

# pnpm Dependency Migration for Codefast Monorepo

Use this skill after outdated dependencies are detected in this repository (prefer `pnpm deps:outdated`).

Default behavior is conservative: do small updates, validate continuously, and stop immediately on failures.

Codebase assumptions:

- Monorepo managed with `pnpm` workspaces and `turbo`
- Root scripts are the source of truth for verification (`test`, `build`, `check-types`, `lint`)
- Dependency versions are mostly managed via `catalog:` in `pnpm-workspace.yaml`
- Required runtime is Node `>=22.0.0`

## Command announcement and status reporting

Before each command:

- Show: `About to run: <command>`

After each command:

- Report exactly one status marker:
  - `✅ passed`
  - `❌ failed`
  - `⚠️ warning`

Failure rule:

- Do not proceed past a failed step without explicit user confirmation.

Major bump uncertainty rule:

- Ask: `This is a major bump — do you want me to check the migration guide first?`

## Phase 1 - Triage and prioritization

1. Run outdated inventory:
   - `pnpm deps:outdated`
2. Run security inventory:
   - `pnpm audit`
3. Categorize each outdated dependency:
   - `SAFE` patch bump: `1.2.3 -> 1.2.4`
   - `CAUTION` minor bump: `1.2.x -> 1.3.x`
   - `BREAKING` major bump: `1.x.x -> 2.x.x`
4. Prioritize update order:
   1. Security vulnerabilities first
   2. Dev dependencies next
   3. Indirect and peer dependencies
   4. Direct production dependencies last

## Phase 2 - Pre-migration checklist

Run in order. If any step fails, stop and report.

1. Ensure clean git state:
   - `git status`
   - Require no uncommitted changes
2. Create migration branch:
   - `git checkout -b chore/update-dependencies`
3. Snapshot lockfile:
   - `cp pnpm-lock.yaml pnpm-lock.yaml.bak`
4. Capture test baseline:
   - `pnpm test` (or `pnpm run test` when needed)
5. Record Node.js version:
   - `node --version`
6. Verify engine compatibility with repo requirement:
   - Node version must satisfy `>=22.0.0`

## Phase 3 - Incremental update strategy

Never update everything blindly in one pass.

For this repo, prefer targeted updates over `deps:update` because `deps:update` runs `pnpm up --latest --recursive` for the entire monorepo.

### Step A: Patch updates (safe batch)

1. Run:
   - `pnpm update --recursive --no-frozen-lockfile`
2. Immediately run validation checks from Phase 4.
3. If checks fail, stop and ask for confirmation before continuing.

### Step B: Minor updates (controlled cadence)

For each package (one-by-one or tight category batches):

1. Read changelog/release notes (npm/GitHub).
2. Apply update:
   - `pnpm up -r <package-name>@<target-version>`
   - If package uses `catalog:`, ensure the corresponding entry in `pnpm-workspace.yaml` is updated.
3. Re-resolve:
   - `pnpm install`
4. Run validation checks from Phase 4.
5. If green, commit:
   - `git commit -m "chore: update <package> <from> -> <to>"`

### Step C: Major updates (manual migration)

For each major bump:

1. Check official migration guide (`<package> v<N> migration guide`).
2. Check for codemods (example: `npx <package>-codemod`).
3. Check and align peer dependency requirements.
4. Update package:
   - `pnpm up -r <package>@latest`
   - If package uses `catalog:`, verify/update the catalog version entry.
5. Implement required code changes for breaking APIs.
6. Run full validation checks from Phase 4.
7. Commit separately:
   - `git commit -m "feat!: migrate <package> v<oldMajor> -> v<newMajor>"`

## Phase 4 - Verification after each package update

Run this sequence every time:

1. `pnpm install`
2. `pnpm check-types`
3. `pnpm lint`
4. `pnpm test`
5. `pnpm build`
6. `pnpm run analyze` (only if script exists in current package/root)

If any command fails:

- stop and report failure
- suggest rollback options from Phase 5
- wait for explicit confirmation before proceeding

## Phase 5 - Rollback strategy

Use the smallest rollback first:

1. Rollback one package:
   - `pnpm add <package>@<previous-version>`
2. Restore lockfile snapshot:
   - `cp pnpm-lock.yaml.bak pnpm-lock.yaml`
   - `pnpm install --frozen-lockfile`
3. Full branch reset (explicit user approval required):
   - `git checkout main`
   - `git branch -D chore/update-dependencies`

## Phase 6 - Documentation output

After migration, provide:

```markdown
## Dependency Update Summary — <date>

### Updated packages

| Package | From   | To     | Type  | Notes                   |
| ------- | ------ | ------ | ----- | ----------------------- |
| axios   | 1.3.0  | 1.7.2  | minor | No breaking changes     |
| react   | 17.0.2 | 18.2.0 | MAJOR | Updated to new root API |

### Breaking changes handled

- react: migrated from `ReactDOM.render` to `createRoot`

### Skipped packages (reason)

- some-package: v4 requires Node 22, current runtime is Node 20
```

## Special cases

### Monorepo (pnpm workspaces)

- Update root dependencies first.
- Then process each workspace package in dependency order (`apps/*`, `packages/**`, `benchmarks/*`).
- Prefer workspace-scoped commands when isolating failures:
  - `pnpm --filter <workspace> test`
  - `pnpm --filter <workspace> build`
  - `pnpm --filter <workspace> check-types`
- Always run root validation before finalizing a commit.

### Pinned versions (no `^` or `~`)

- Do not update automatically.
- Includes non-range versions in `pnpm-workspace.yaml` catalog and explicit versions in package manifests.
- Ask for explicit approval before changing pinned constraints.

### Private/internal packages

- Skip automated updates.
- Flag for manual review with owner follow-up.

### Peer dependency conflict matrix

- Check `peerDependencies` compatibility before bumping related packages.
- When peer ranges conflict, stop and propose compatible version sets.

### `@types/*` synchronization

- Update `@types/<pkg>` in sync with runtime package updates when applicable.
- In this repo, keep `react/react-dom` aligned with `@types/react/@types/react-dom`.

### Framework ecosystems (Next.js, Vite, etc.)

- Treat ecosystem packages as grouped migrations.
- Example: `next` + `eslint-config-next` + framework plugin set.
- For docs app, treat Vite/TanStack/React compiler stack as migration units when majors change:
  - `vite`, `@vitejs/plugin-react`, `@tanstack/*`, `babel-plugin-react-compiler`
- Validate group as a unit before commit.

## Execution guardrails

- Prefer isolated commits per package or migration unit.
- Keep commit messages migration-focused and reversible.
- If baseline tests are already failing, stop and ask whether to continue.
- If changelog or migration guide cannot be found, report warning and ask how to proceed.
- Prefer `pnpm deps:outdated` for inventory and avoid `pnpm deps:update` unless user explicitly approves repo-wide latest bumps.
