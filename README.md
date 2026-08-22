<h1 align="center">CodeFast</h1>

<p align="center">
  Beautiful, accessible React components — and the type-safe tooling around them.<br/>
  70+ primitives built on Radix UI and Tailwind CSS 4, designed for React 19.
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

The flagship package is [`@codefast/ui`](packages/ui): **70+ accessible React components** built on Radix UI primitives,
styled with Tailwind CSS 4, and fully typed. Around it, this monorepo publishes the supporting `@codefast/*` packages —
variant styling, theming, event tracking, dependency injection, and shared TypeScript configuration.

Browse every component with live previews and copy-ready source at **[codefastlabs.com](https://codefastlabs.com)**.

## Quick Start

Install the component library:

```bash
pnpm add @codefast/ui
```

Wire it into your Tailwind CSS 4 stylesheet:

```css
@import "tailwindcss";
@import "@codefast/ui/css/themes/neutral.css";
@import "@codefast/ui/css/preset.css";
```

Every component ships as its own sub-path import — pull in only what you use:

```tsx
import { Button } from "@codefast/ui/button";

export function MyPage() {
  return <Button variant="outline">Click me</Button>;
}
```

Requires React 19 and Tailwind CSS 4. See [codefastlabs.com](https://codefastlabs.com) for per-component documentation.

## Status: 0.x, versioned per package

Every package is on **0.x**, and each one moves on its own version track — releasing one leaves the others at their
current versions, so a version number describes the package that carries it. These packages are built for the
maintainer's own projects first, so a 1.0 is a per-package call, taken when that package's API is worth committing to:
none is scheduled, and none is ruled out. While a package is on 0.x, **breaking changes ship as minor versions** — the
caret range npm installs by default holds you inside the current minor, so one never arrives unasked — read the
[changelog](https://github.com/codefastlabs/codefast/releases) before you widen it.

Install the default `latest` — the documentation site tracks it:

```bash
pnpm add @codefast/ui
```

An open API is the point rather than a phase to get through, so feedback stays welcome indefinitely — if a name is
confusing, a prop feels awkward, or a component is missing,
[open an issue](https://github.com/codefastlabs/codefast/issues/new) or
[start a discussion](https://github.com/codefastlabs/codefast/discussions).

## Packages

| Package                                                     | Description                                                                                     |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [`@codefast/ui`](packages/ui)                               | 70+ accessible React components built on Radix UI primitives and Tailwind CSS 4                 |
| [`@codefast/tailwind-variants`](packages/tailwind-variants) | Type-safe variant styling API — a faster drop-in replacement for `tailwind-variants`            |
| [`@codefast/theme`](packages/theme)                         | Appearance management for React 19 — optimistic updates, cross-tab sync, FOUC-free SSR          |
| [`@codefast/tracking`](packages/tracking)                   | Consent-gated, type-safe event tracking for TanStack Start over a Standard Schema event catalog |
| [`@codefast/di`](packages/di)                               | Lightweight dependency-injection primitives for TypeScript                                      |
| [`@codefast/cli`](packages/cli)                             | Developer CLI for the monorepo (`arrange`, `audit`, `mirror`, `tag`)                            |
| [`@codefast/typescript-config`](packages/typescript-config) | Shared TypeScript configuration presets                                                         |

## Repository Layout

| Path                                                 | Role                                                                                                                        |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| [`apps/ui`](apps/ui)                                 | Docs and showcase site behind [codefastlabs.com](https://codefastlabs.com) (TanStack Start), consuming local package source |
| [`examples/tanstack-start`](examples/tanstack-start) | Consumer smoke test — runs the packages' built `dist/` via `workspace:*` links                                              |
| [`benchmarks/`](benchmarks)                          | Benchmark suites comparing `@codefast/*` against upstream libraries (`pnpm bench`)                                          |

## Development

### Prerequisites

- **Node.js** ≥ 24
- **pnpm** 11 (pinned via `packageManager`)

### Setup

```bash
git clone https://github.com/codefastlabs/codefast.git
cd codefast
pnpm install
pnpm build:packages   # required once before running apps or type-aware lint
pnpm dev              # start all apps and packages in watch mode
```

### Scripts

| Command               | Description                                                         |
| --------------------- | ------------------------------------------------------------------- |
| `pnpm dev`            | Start all apps and packages in development mode                     |
| `pnpm build:packages` | Build only `packages/*` (run after editing any package source)      |
| `pnpm check`          | Lint + format check + type check (static gate, no fixes)            |
| `pnpm check:fix`      | Lint with `--fix` + format write                                    |
| `pnpm test`           | Run tests across the monorepo                                       |
| `pnpm test:coverage`  | Run tests with coverage reports                                     |
| `pnpm verify`         | Full gate: build, lint, format, type check, and tests with coverage |
| `pnpm bench`          | Run the benchmark suites                                            |

Linting and formatting run on [Oxc](https://oxc.rs) (Oxlint + Oxfmt); native
[TypeScript 7](https://www.typescriptlang.org) (`tsc`) handles both type checking and library builds (emitting `.js` +
`.d.ts` per file, no bundler), while [Vite](https://vite.dev) (Rolldown) bundles the browser apps. Tests follow a strict
category taxonomy — see [TESTING.md](TESTING.md).

## Contributing

1. [Fork](https://github.com/codefastlabs/codefast/fork) the repository and clone your fork.
2. `pnpm install && pnpm build:packages`
3. Create a feature branch and make your changes, adding tests where applicable (see [TESTING.md](TESTING.md)).
4. Run `pnpm verify` from the repo root.
5. Add a changeset (`pnpm exec changeset`) when a published package changes.
6. Commit following [Conventional Commits](https://www.conventionalcommits.org/) and open a
   [Pull Request](https://github.com/codefastlabs/codefast/pulls).

Read [CONTRIBUTING.md](CONTRIBUTING.md) before your first change — the toolchain is deliberately non-standard (Oxc
instead of ESLint/Prettier, native TypeScript 7 with no bundler for `packages/*`), and the test taxonomy and comment
rules are enforced. Versioning and releases are managed with [Changesets](https://github.com/changesets/changesets).

Found a problem? Use the [issue templates](https://github.com/codefastlabs/codefast/issues/new/choose) — there is a
dedicated one for performance regressions. Participation is governed by the [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

Please report vulnerabilities privately — see [SECURITY.md](SECURITY.md). Do not open a public issue.

## License

[MIT](LICENSE)
