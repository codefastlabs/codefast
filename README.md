<h1 align="center">Codefast Labs</h1>

<p align="center">
  Open-source TypeScript packages for React 19 products, published under <code>@codefast</code>.<br/>
  Components, variant styling, appearance management, consent-gated tracking, dependency injection, and the tooling that ties them together.
</p>

<p align="center">
  <a href="https://codefastlabs.com"><strong>codefastlabs.com</strong></a> — documentation, live previews, and copy-ready source
</p>

<p align="center">
  <a href="https://github.com/codefastlabs/codefast/actions/workflows/release.yml"><img src="https://github.com/codefastlabs/codefast/actions/workflows/release.yml/badge.svg?branch=main" alt="Release"></a>
  <a href="https://codecov.io/gh/codefastlabs/codefast"><img src="https://img.shields.io/codecov/c/github/codefastlabs/codefast" alt="Test Coverage"></a>
  <a href="https://www.npmjs.com/package/@codefast/ui"><img src="https://img.shields.io/npm/v/@codefast/ui" alt="NPM Version"></a>
  <a href="https://bundlephobia.com/package/@codefast/ui"><img src="https://img.shields.io/bundlephobia/minzip/@codefast/ui" alt="Bundle Size"></a>
  <a href="https://www.npmjs.com/package/@codefast/ui"><img src="https://img.shields.io/npm/dm/@codefast/ui" alt="NPM Downloads"></a>
  <a href="https://github.com/codefastlabs/codefast/blob/main/LICENSE"><img src="https://img.shields.io/github/license/codefastlabs/codefast" alt="License"></a>
</p>

<p align="center">
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-blue" alt="React"></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-strict-blue" alt="TypeScript"></a>
  <a href="https://www.radix-ui.com/primitives"><img src="https://img.shields.io/badge/Radix_UI-primitives-blue" alt="Radix UI"></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind CSS"></a>
  <a href="https://tanstack.com/start"><img src="https://img.shields.io/badge/TanStack_Start-1-orange" alt="TanStack Start"></a>
</p>

---

This monorepo publishes the `@codefast/*` packages — a family of small, strictly typed libraries for building React 19
products. The flagship is [`@codefast/ui`](packages/ui): 70+ accessible components built on Radix UI primitives and
styled with Tailwind CSS 4. Around it sit the packages a product reaches for next — a type-safe variant API, appearance
management, consent-gated event tracking, dependency injection with an auto-mocking test bed, and the shared TypeScript
configuration and CLI that keep the repo consistent.

Every package is documented at **[codefastlabs.com](https://codefastlabs.com)** — component previews with copy-ready
source under `/ui`, and each package's own README, specification, and architecture notes under `/docs/<pkg>`.

## Packages

| Package                                                     | Description                                                                                     |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [`@codefast/ui`](packages/ui)                               | 70+ accessible React components built on Radix UI primitives and Tailwind CSS 4                 |
| [`@codefast/tailwind-variants`](packages/tailwind-variants) | Type-safe variant styling API — a faster drop-in replacement for `tailwind-variants`            |
| [`@codefast/theme`](packages/theme)                         | Appearance management for React 19 — optimistic updates, cross-tab sync, FOUC-free SSR          |
| [`@codefast/tracking`](packages/tracking)                   | Consent-gated, type-safe event tracking for TanStack Start over a Standard Schema event catalog |
| [`@codefast/di`](packages/di)                               | Lightweight dependency-injection primitives for TypeScript                                      |
| [`@codefast/di-testing`](packages/di-testing)               | Solitary and sociable auto-mocking test beds for `@codefast/di`                                 |
| [`@codefast/cli`](packages/cli)                             | Developer CLI for the monorepo (`arrange`, `audit`, `mirror`, `tag`)                            |
| [`@codefast/typescript-config`](packages/typescript-config) | Shared TypeScript configuration presets                                                         |

## Quick start

The flagship package is the fastest way in. Install it:

```bash
pnpm add @codefast/ui
```

Wire it into your Tailwind CSS 4 stylesheet:

```css
@import "tailwindcss";
@import "@codefast/ui/css/themes/neutral.css";
@import "@codefast/ui/css/preset.css";
```

Every component ships as its own subpath import, so you pull in only what you use:

```tsx
import { Button } from "@codefast/ui/button";

export function MyPage() {
  return <Button variant="outline">Click me</Button>;
}
```

`@codefast/ui` requires React 19 and Tailwind CSS 4. Getting started and per-component documentation live at
[codefastlabs.com/ui](https://codefastlabs.com/ui); every other package is documented at
`https://codefastlabs.com/docs/<pkg>`.

## Status: 0.x, versioned per package

Every package is on **0.x**, and each one moves on its own version track: releasing one leaves the others where they
are, so a version number describes the package that carries it. A 1.0 is a per-package call, taken when that package's
API is worth committing to — none is scheduled, and none is ruled out.

While a package is on 0.x, **breaking changes ship as minor versions**. The caret range npm installs by default keeps
you inside the current minor, so one never arrives unasked; read the
[release notes](https://github.com/codefastlabs/codefast/releases) before you widen it. Install the default `latest` —
the documentation site tracks it.

Feedback is welcome at any stage: if a name is confusing, a prop feels awkward, or a component is missing,
[open an issue](https://github.com/codefastlabs/codefast/issues/new) or
[start a discussion](https://github.com/codefastlabs/codefast/discussions).

## Repository layout

The workspace is laid out by audience: who consumes a directory decides where it lives.

| Path                                                 | Role                                                                                                               |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [`apps/ui`](apps/ui)                                 | The codefastlabs.com portal (TanStack Start): package landing, `/docs/<pkg>` docs, and the `@codefast/ui` showcase |
| [`packages/`](packages)                              | The published `@codefast/*` libraries — nothing else lives here                                                    |
| [`internal/`](internal)                              | Private workspace packages consumed only inside the repo (the benchmark harness and viewer); never published       |
| [`benchmarks/`](benchmarks)                          | Benchmark suites comparing `@codefast/*` against upstream libraries (`pnpm bench`)                                 |
| [`examples/tanstack-start`](examples/tanstack-start) | Consumer demo that runs the packages' built `dist/` through `workspace:*` links                                    |
| [`docs/`](docs)                                      | Repo-level documents organised by type: decisions, guides, reports, runbooks                                       |

A new package starts in `internal/` and moves to `packages/` when it is published.

## Development

### Prerequisites

- **Node.js** ≥ 24
- **pnpm** 11 (pinned via `packageManager`)

### Setup

```bash
git clone https://github.com/codefastlabs/codefast.git
cd codefast
pnpm install
pnpm build:packages   # required once before running apps, type-checking, or type-aware lint
pnpm dev              # start all apps and packages in watch mode
```

### Scripts

| Command                | Description                                                                  |
| ---------------------- | ---------------------------------------------------------------------------- |
| `pnpm dev`             | Start all apps and packages in watch mode                                    |
| `pnpm build:packages`  | Build only `packages/*` (run after editing any package source)               |
| `pnpm check-types`     | Type-check the whole repo with native `tsc --noEmit`                         |
| `pnpm check`           | Lint + format check + type check (static gate, no fixes)                     |
| `pnpm check:fix`       | Lint with `--fix` + format write                                             |
| `pnpm test`            | Run every test category across the monorepo                                  |
| `pnpm test:unit`       | Run only the unit category (`test:integration`, `test:e2e`, `test:type` too) |
| `pnpm test:coverage`   | Run tests with coverage reports                                              |
| `pnpm verify`          | Full gate: build, lint, format, type check, and tests with coverage          |
| `pnpm bench`           | Run the benchmark suites                                                     |
| `pnpm cli:audit:links` | Check every Markdown link and anchor in the repo                             |
| `pnpm release`         | Add a changeset for a package change                                         |

Linting and formatting run on [Oxc](https://oxc.rs) (Oxlint + Oxfmt). Native
[TypeScript 7](https://www.typescriptlang.org) (`tsc`) handles both type checking and library builds, emitting `.js` and
`.d.ts` per file with no bundler; [Vite](https://vite.dev) (Rolldown) bundles only the browser apps. Tests follow a
strict category taxonomy — see [TESTING.md](TESTING.md).

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before your first change: the toolchain is deliberately non-standard, and the
test taxonomy ([TESTING.md](TESTING.md)) and comment rules are enforced by CI. In short: fork, `pnpm install`,
`pnpm build:packages`, make the change with tests, run `pnpm verify`, add a changeset (`pnpm release`) when a published
package changes, commit following [Conventional Commits](https://www.conventionalcommits.org/), and open a pull request.
Versioning and releases are managed with [Changesets](https://github.com/changesets/changesets).

Found a problem? Use the [issue templates](https://github.com/codefastlabs/codefast/issues/new/choose). Participation is
governed by the [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

Report vulnerabilities privately — see [SECURITY.md](SECURITY.md). Do not open a public issue.

## License

[MIT](LICENSE)
