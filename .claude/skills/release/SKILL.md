---
name: release
description:
  Release flow for the @codefast/* packages — writing a changeset, canary mode, versioning and publishing through CI.
  Use when releasing, preparing a new version, entering or leaving canary mode, or working out why a package has not
  been published.
---

# Release flow (changesets + CI)

## Ground rules

- Every `@codefast/*` package versions **independently** — `.changeset/config.json` declares no `fixed` group, so a
  changeset bumps only the packages it names, plus their dependents via `updateInternalDependencies: "patch"`.
  `privatePackages.version: true` is set so the four private `@codefast/benchmark-*` are versioned and changelogged
  (Changesets 3.0 defaults it to `false`). `@apps/ui` is in `ignore` and never needs a changeset.
- **Do not run `pnpm changeset add`** (an interactive TUI). Write the `.changeset/<kebab-case>.md` file yourself:

  ```md
  ---
  "@codefast/ui": patch
  ---

  One sentence summarising it for the changelog.
  ```

- Publishing is **CI's job** (`.github/workflows/release.yml`, where `changesets/action` runs `npx changeset publish`)
  when a change under `.changeset/**` lands on `main`. Never publish by hand from a local machine — the one exception is
  bootstrapping a brand-new package (see below).
- CI authenticates to npm with **OIDC trusted publishing**, not an `NPM_TOKEN` (`changesets/action` v2 dropped the
  token-to-`.npmrc` handling). The release job has `id-token: write`, and each published package has a trusted publisher
  on npmjs.com pinned to org `codefastlabs`, repo `codefast`, workflow `release.yml`, permission `npm publish`.
- CI publishes in **two steps**: pushing a changeset to `main` makes `changesets/action` **not publish immediately**,
  but open the release PR `chore: release new version` (branch `changeset-release/main`) carrying the version bump.
  **Merging that PR** is what makes the next run `changeset publish` to npm.

## A `major` bumps only the package it names

A 1.0 is a per-package decision: a `major` takes that one package to 1.0 and leaves the rest where they are. Reach for
one only when that package's API is worth committing to — ask first — and while a package is on 0.x prefer `minor` for a
breaking change, which is what keeps breaking changes cheap. Any bump is irreversible once versioned or published in
canary: **editing changesets alone cannot undo it** (the bump is baked into `package.json` + `pre.json`) — use the reset
recipe below.

## Resetting canary back to 0.x after a wrong version jump (verified)

1. Lower the incorrect changesets from `major` to `minor`.
2. Reset the `package.json` of every package the wrong bump reached — `git diff` is the authoritative list, not the
   changeset's, since `updateInternalDependencies` drags dependents along, including the two under `benchmarks/*`
   (`benchmark-di-inversify`, `benchmark-tailwind-variants`).
3. Set each one back to the **most recently published** canary of the line you want to continue (e.g. `0.5.0-canary.5`)
   so CI computes the next as `.6` — the counter is that package's max published prerelease + 1, so avoid numbers
   already published.
4. Clear `pre.json.changesets` (`[]`) so the changeset set re-applies from that base.
5. Commit → push → merge the release PR → CI publishes.
6. A 1.x that was already published cannot be removed; `npm deprecate` those.

To read the computed numbers **without mutating anything** (no `GITHUB_TOKEN`, no cleanup): `changeset status` writes
the whole release plan as JSON, with each package's old and new version.

```bash
pnpm exec changeset status --output=/tmp/plan.json
```

Prefer that over the mutating route. If you do need the real thing: temporarily set `changelog: false` in
`.changeset/config.json`, run `pnpm exec changeset version`, read the numbers, then `git checkout -- .`
(changelog-github needs a token by default, so `changeset version` bails out — that is not a version-logic error).

## Stable release

1. Make sure every change worth releasing has a changeset alongside it in the commit.
2. Merge to `main` — CI will version and publish (the `version-packages` script is
   `changeset version && pnpm run codefast tag`, where `codefast tag` adds `@since` to the JSDoc).

Since Changesets 3.0, `changeset version` **exits 1 when there is no unreleased changeset** (it used to exit 0). So
`version-packages` now fails rather than silently no-opping, and `codefast tag` does not run. `changesets/action` only
invokes it when it has detected changesets, so this surfaces as a local mistake far more often than a CI failure.

## Canary

```bash
pnpm run release:canary:enter   # changeset pre enter canary — commits the .changeset/pre.json file
# ... changesets from here on will version as x.y.z-canary.N
pnpm run release:canary:exit    # changeset pre exit — leave canary mode
```

Checking the state: if `.changeset/pre.json` exists, the repo is in canary mode.

Since Changesets 3.0, a canary `changeset version` **moves the consumed `.md` files into `.changeset/pre/`** instead of
leaving them in the root. An almost-empty `.changeset/` during canary is therefore normal and does **not** mean the
changesets were lost — `@changesets/read` still reads that folder, exposing each one under the id `pre/<name>`, which is
also the form recorded in `pre.json.changesets`. Clearing `pre.json.changesets` re-applies them from where they sit; no
files need moving back.

## Adding a brand-new package (first publish + trusted publishing)

A trusted publisher is configured **per package** on npmjs.com and can only be added **after the package exists** there;
npm does not yet support publishing an initial version over OIDC (`npm/cli#8544`). So a new `@codefast/*` package needs
a one-time manual bootstrap, and it must happen **before** the package's first changeset reaches `main` — the release
run publishes every package a changeset bumps, so an unconfigured new member fails it.

1. Publish the first version from a machine logged in to npm (needs 2FA — cannot be automated):

   ```bash
   pnpm build:packages
   pnpm --filter @codefast/<name> publish --access public
   ```

2. On npmjs.com: package → **Settings** → **Trusted Publisher** → **GitHub Actions** → org `codefastlabs`, repo
   `codefast`, workflow `release.yml`, tick **Allow npm publish** → **Set up connection** (enter 2FA).

From then on CI releases it via OIDC like the rest. There is no org-level trusted publisher, so this repeats for every
new published package.

## Checklist before merging a release

- `pnpm run verify` is green (build packages + lint + format + check-types + test:coverage).
- The changeset states the right bump level (patch/minor/major) and names every package that changed — nothing else is
  bumped for it.
