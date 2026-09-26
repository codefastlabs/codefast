---
name: release
description:
  Release flow for the @codefast/* packages — writing a changeset, canary mode, versioning and publishing through CI.
  Use when writing or checking a changeset for a change, releasing, preparing a new version, entering or leaving canary
  mode, or working out why a package has not been published.
---

# Release flow (changesets + CI)

## Ground rules

- The versioning policy — independent tracks per package, when a `major` is warranted, how to read the pre-mode state —
  is in CLAUDE.md's "Releases" section, which is always in context; this skill covers the procedures. `@apps/*` and
  `@examples/*` are in `.changeset/config.json#ignore` and never need a changeset.
- **Ask before a `major`.** It takes that one package to 1.0, and no edit to the changesets can take it back once
  versioned — only the reset recipe below can.
- **Merging the release PR publishes to npm, so it is the maintainer's decision.** Report the release state; never merge
  that PR or suggest merging it.
- **Do not run `pnpm changeset add`** (an interactive TUI). Write the `.changeset/<kebab-case>.md` file yourself:

  ```md
  ---
  "@codefast/ui": patch
  ---

  One sentence summarising it for the changelog.
  ```

- Publishing is **CI's job** (`.github/workflows/release.yml`, where `changesets/action` runs
  `pnpm run publish-packages` — `codefast pack-slim`, then `changeset publish`) when a change under `.changeset/**`
  lands on `main`. Never publish by hand from a local machine — the one exception is bootstrapping a brand-new package
  (see below).
- CI authenticates to npm with **OIDC trusted publishing**, not an `NPM_TOKEN` (`changesets/action` v2 dropped the
  token-to-`.npmrc` handling). The release job has `id-token: write`, and each published package has a trusted publisher
  on npmjs.com pinned to org `codefastlabs`, repo `codefast`, workflow `release.yml`, permission `npm publish`.
- CI publishes in **two steps**: pushing a changeset to `main` makes `changesets/action` **not publish immediately**,
  but open the release PR `chore: release new version` (branch `changeset-release/main`) carrying the version bump.
  **Merging that PR** is what makes the next run `changeset publish` to npm.

## Resetting canary back to 0.x after a wrong version jump

1. Lower the incorrect changesets from `major` to `minor`.
2. Reset the `package.json` of every package the wrong bump reached — `git diff` is the authoritative list, not the
   changeset's, since `updateInternalDependencies` drags dependents along, including the two under `benchmarks/*`
   (`@benchmark/di`, `@benchmark/tailwind-variants`).
3. Set each one back to the **most recently published** canary of the line you want to continue (e.g. `0.5.0-canary.5`)
   so CI computes the next as `.6` — the counter is that package's max published prerelease + 1, so avoid numbers
   already published.
4. Clear `pre.json.changesets` (`[]`) so the changeset set re-applies from that base. The consumed files stay where they
   sit in `.changeset/pre/`; nothing needs moving back.
5. Commit → push. CI updates the release PR; publishing waits for the maintainer to merge it.
6. A 1.x that was already published cannot be removed; `npm deprecate` those.

To read the computed numbers **without mutating anything** (no `GITHUB_TOKEN`, no cleanup): `changeset status` writes
the whole release plan as JSON, with each package's old and new version.

```bash
pnpm exec changeset status --output=/tmp/plan.json
```

Prefer that over the mutating route. If you do need the real thing: temporarily set `changelog: false` in
`.changeset/config.json`, run `pnpm exec changeset version`, read the numbers, then `git checkout -- .`
(`.changeset/changelog.js` looks up each changeset's pull request on GitHub, so without `GITHUB_TOKEN`
`changeset version` bails out — that is not a version-logic error).

## Stable release

1. Make sure every change worth releasing has a changeset alongside it in the commit.
2. Merge to `main` — CI opens or updates the release PR, running `version-packages`
   (`changeset version && pnpm run codefast tag`, where `codefast tag` adds `@since` to the TSDoc). Publishing waits for
   the maintainer to merge that PR.

`changeset version` **exits 1 when there is no unreleased changeset**, so `version-packages` fails rather than
no-opping, and `codefast tag` does not run. `changesets/action` only invokes it when it has detected changesets, so this
surfaces as a local mistake far more often than a CI failure.

## Canary

```bash
pnpm run release:canary:enter   # changeset pre enter canary — commits the .changeset/pre.json file
# ... changesets from here on will version as x.y.z-canary.N
pnpm run release:canary:exit    # changeset pre exit — leave canary mode
```

Checking the state and reading a near-empty `.changeset/` during canary are covered in CLAUDE.md's "Releases" section.
The id each consumed changeset is recorded under in `pre.json.changesets` is `pre/<name>`.

Leaving canary mode does not touch npm: every package keeps its `canary` dist-tag on its last canary, so
`pnpm add @codefast/<pkg>@canary` installs a version older than `latest`. Trusted publishing authenticates `npm publish`
only, so CI cannot move a dist-tag; after `release:canary:exit`, a maintainer logged in to npm clears them, and the next
canary publish sets the tag again:

```bash
for pkg in $(pnpm -r ls --json --depth -1 | jq -r '.[] | select(.private | not) | .name'); do
  if [ -n "$(npm view "$pkg" dist-tags.canary)" ]; then npm dist-tag rm "$pkg" canary; fi
done
```

## Adding a brand-new package (first publish + trusted publishing)

A trusted publisher is configured **per package** on npmjs.com and can only be added **after the package exists** there,
and npm cannot publish a package's first version over OIDC — tracked in `npm/cli#8544`, so check that issue before
assuming it still holds. So a new `@codefast/*` package needs a one-time manual bootstrap, and it must happen **before**
the package's first changeset reaches `main` — the release run publishes every package a changeset bumps, so an
unconfigured new member fails it.

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
