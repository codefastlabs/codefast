# @codefast/di

Lightweight dependency injection primitives for Codefast.

[![CI](https://github.com/codefastlabs/codefast/actions/workflows/release.yml/badge.svg)](https://github.com/codefastlabs/codefast/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/@codefast/di.svg)](https://www.npmjs.com/package/@codefast/di)
[![npm downloads](https://img.shields.io/npm/dm/@codefast/di.svg)](https://www.npmjs.com/package/@codefast/di)
[![license](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Core concepts](#core-concepts)
- [Quick start](#quick-start)
- [Package exports](#package-exports)
- [Deep dive](#deep-dive)
- [Contributing](#contributing)
- [License](#license)
- [Changelog](#changelog)

## Overview

`@codefast/di` is a small, **ESM-only** IoC library: a **`Container`** holds bindings, **`token()`** defines branded, type-safe keys, and **TC39 Stage 3 class decorators** (`@injectable`, `@inject`, `@optional`, …) declare constructor dependencies via `Symbol.metadata`—no `reflect-metadata` and no legacy `experimentalDecorators`.

**Highlights:**

- **Type-safe tokens** — `Token<Value>` prevents accidental `get<WrongType>(…)` at compile time.
- **Fluent binding API** — constants, classes, sync/async factories, scopes, tags, constraints, and lifecycle hooks.
- **Modules** — compose registration with synchronous and asynchronous `Module` / `AsyncModule` loaders.
- **Scope rules** — static and runtime checks against invalid singleton → scoped/transient edges.
- **Tree-shakeable subpaths** — import only the surface you need (`@codefast/di/container`, `@codefast/di/errors`, …).

## Installation

```bash
pnpm add @codefast/di
```

Using npm:

```bash
npm install @codefast/di
```

**Requirements:**

- **Node.js** `>= 22.0.0`
- **TypeScript** `5.9+` recommended, with **TC39 Stage 3 decorators** enabled (native decorators; set `experimentalDecorators: false` in `tsconfig`).

## Core concepts

Dependencies are registered on a **`Container`** under **`Token<T>`** keys or **constructor** types. Classes opt into constructor injection with **`@injectable([…])`**, listing each parameter as **`inject(token)`** (or **`optional(token)`**). Resolution walks the graph using explicit metadata—**reference equality** on tokens matters: reuse the same `token()` value for bind and inject.

## Quick start

```typescript
import { Container, inject, injectable, token } from "@codefast/di";

interface Clock {
  now(): number;
}

const ClockToken = token<Clock>("Clock");

@injectable([inject(ClockToken)])
class Greeter {
  constructor(private readonly clock: Clock) {}

  message(): string {
    return `Hello at ${String(this.clock.now())}`;
  }
}

const container = Container.create();

container.bind(ClockToken).toConstantValue({ now: () => Date.now() });
container.bind(Greeter).toSelf().singleton();

const greeter = container.resolve(Greeter);
console.log(greeter.message());
```

For larger apps, assemble registration with **`Module.create`** / **`Module.createAsync`** and **`Container.fromModules`** / **`Container.fromModulesAsync`** (see tests and the design spec).

## Package exports

The default entry **`@codefast/di`** re-exports the public façade: **`Container`**, **`token`**, decorators (**`inject`**, **`optional`**, **`injectable`**, **`scoped`**, **`singleton`**), **`Module`** / **`AsyncModule`**, structured **`DiError`** subclasses, and shared types (**`Token`**, **`TokenValue`**, **`BindingIdentifier`**, **`ResolveOptions`**, **`ContainerSnapshot`**).

Subpath exports (each maps to `dist/*.mjs` + types) cover the rest of the stack for advanced or tree-shaken use:

| Subpath                                                                                                 | Role                                                                   |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `@codefast/di/container`                                                                                | Container implementation types and `DefaultContainer` if you need them |
| `@codefast/di/binding`, `@codefast/di/binding-select`                                                   | Binding builders, identifiers, resolution hints                        |
| `@codefast/di/token`                                                                                    | `token()` and `Token` types                                            |
| `@codefast/di/module`                                                                                   | `Module`, `AsyncModule`, module builders                               |
| `@codefast/di/registry`, `@codefast/di/resolver`, `@codefast/di/scope`, `@codefast/di/scope-validation` | Registry, resolution, scope management, static validation              |
| `@codefast/di/lifecycle`                                                                                | Activation / deactivation types                                        |
| `@codefast/di/constraints`                                                                              | Conditional binding predicates                                         |
| `@codefast/di/dependency-graph`, `@codefast/di/inspector`                                               | Debugging and graph snapshots                                          |
| `@codefast/di/errors`                                                                                   | Error hierarchy                                                        |
| `@codefast/di/environment`                                                                              | Environment helpers used by the container                              |
| `@codefast/di/decorators`, `@codefast/di/decorators/*`                                                  | Decorator entry points split for fine-grained imports                  |

See **`package.json` → `exports`** for the authoritative list.

## Deep dive

For design goals (comparison with Inversify-style stacks, token and binding model, module system, error taxonomy, and file layout), read the full specification:

**[./docs/di-library-design-spec.md](./docs/di-library-design-spec.md)**

## Contributing

This package lives in the [Codefast monorepo](https://github.com/codefastlabs/codefast). From the repo root:

```bash
pnpm --filter @codefast/di build
pnpm --filter @codefast/di test
```

## License

[MIT](https://opensource.org/licenses/MIT) (see `license` in [`package.json`](./package.json)).

## Changelog

Version history is published on [npm](https://www.npmjs.com/package/@codefast/di?activeTab=versions) with each release.
