# Support policy

## Node.js

Each package declares its own Node.js floor in `engines.node`, and every `@codefast/*` package currently declares
**Node.js 24.0.0 or later**. That is the first release with explicit resource management built in (`using`,
`await using`, `DisposableStack`, `AsyncDisposableStack`, `SuppressedError`) and all of ES2025, so code that runs on
Node can rely on both as the platform ships them, with no shim. The repo targets modern runtimes rather than the widest
audience, so an older line stays unsupported even while it is maintained. A package's floor rises, by a `minor` of that
package, when its line reaches [end-of-life](https://github.com/nodejs/release#release-schedule) or when the package
needs a feature only a newer line ships — and only to a line that the serverless runtimes it deploys to offer.

| Line    | Role            | Status                      |
| ------- | --------------- | --------------------------- |
| Node 22 | Maintenance LTS | Not supported               |
| Node 24 | Active LTS      | Supported — `engines` floor |
| Node 26 | Current         | Supported                   |

Floors are enforced mechanically rather than by convention:

- **`@types/node`** is pinned per floor. `pnpm-workspace.yaml` holds one `node<N>` catalog for each floor in use,
  pinning `@types/node` to that floor's release line (`~24.0`), and a package names the catalog of its own floor, so a
  Node API newer than the floor is a type error, including one a later 24.x minor added, such as
  `fs.mkdtempDisposableSync` (24.4). An override holds every transitive `@types/node` to the lowest floor's line without
  touching the catalogs. Dependabot ignores its major and minor updates (`.github/dependabot.yml`), so a pin moves only
  when its floor does.
- **`lib` and `target`** are `ES2025`, the newest edition that both Node 24 and the [browser floor](#browsers) ship. A
  builtin newer than that, such as `Map.prototype.getOrInsert`, is a type error rather than a runtime crash.
- **Node types reach only code that runs on Node.** A package that runs on Node sets `types: ["node"]` in its build
  config, which also brings explicit resource management. Every other build loads no ambient types, so a Node global in
  browser or universal code fails the build.
- **Internal subpath imports** use a bare `#` prefix (`#core/token`), which Node's ESM resolver accepts on every
  supported line — `#/`-prefixed specifiers are rejected below Node 24.14.
- **`codefast audit engines`** holds the floors to each other. A published package declares one, written `>=X.Y.Z`, no
  lower than the toolchain's (the root `package.json`) or the floor of any workspace package it depends on at runtime,
  since a consumer on its floor would otherwise install a dependency that cannot run there. The lockfile must resolve
  its `@types/node` on its floor's release line.
- **CI** develops on the Current line (`.node-version`) for speed, and a matrix runs each package's unit and end-to-end
  suites on its own floor — one leg per distinct floor, planned from `codefast audit engines --json` — so every floor is
  a contract CI proves. `codefast audit publish` statically checks the publish surface — no `#/` imports, and every
  `exports`/`imports` target ships.

Raising one package's floor touches only that package and whatever depends on it at runtime: add a `node<N>` catalog if
none exists yet, set its `engines.node` and its `@types/node` to `catalog:node<N>`, raise each package the audit names
as depending on it, and give each a `minor` changeset. A floor alone does not widen `lib` for code that also runs in a
browser, which the browser floor bounds.

Development uses the latest Node for speed and tooling; nothing about the contributor's local Node version can leak into
the published packages, because each floor is checked by the compiler and by CI. A contributor's local Node must be at
least the toolchain's floor, which also covers the Node the repo's own toolchain (pnpm) needs, and which no package's
floor sits below.

## Browsers

Code that runs in a browser supports **Chrome and Edge 136, Firefox 136, and Safari 18.4 (macOS and iOS) or later**.
That covers `@codefast/ui`, `@codefast/theme`, the client half of `@codefast/tracking`, and the universal
`@codefast/tailwind-variants` and `@codefast/di`. These are the first releases that ship every ES2025 builtin: iterator
helpers reached Safari in 18.4, `RegExp.escape` reached Chrome in 136, and `Intl.DurationFormat` reached Firefox in 136.
As with Node, the floor is what every current major browser ships, not what the oldest browser in use ships.

- **The DOM presets' `lib`** is `DOM`, `DOM.Iterable` and `ES2025`, so an ECMAScript builtin past the floor is a type
  error.
- **Explicit resource management stays out.** Safari has not shipped it: MDN lists `DisposableStack` in Safari only as a
  preview. `ESNext.Disposable` joins the DOM presets once every browser on the floor ships it.
- **DOM APIs are not filtered by version.** TypeScript's `DOM` lib declares every specified API, so code that uses one
  newer than the floor detects it before use.

The floor rises with the edition. When every current major browser ships the builtins of the next ECMAScript edition,
`lib` moves to that edition and the versions above move with it.

## TypeScript

The `@codefast/*` packages support **TypeScript 7 or later**. The floor is the compiler the repo builds and type-checks
every package with — TypeScript 7 alone emits the published `.d.ts` files — not the oldest release that happens to
accept them.

- **`@codefast/typescript-config`** declares it as its `typescript` peer range (`>=7.0.0`).
- **`@codefast/cli`** declares it as an optional `typescript` peer (`>=7.0.0`), which only
  `arrange simplify --fold-variant-classname` loads.
- **The other packages** state it in their README and declare no `typescript` peer.

Explicit resource management enters the language in ES2027, so no numbered `lib` declares it yet. `@codefast/di` and
`@codefast/di-testing` name its symbols and interfaces in their declarations, so a program that uses them needs its
types. A Node program gets them from `@types/node` 24 or later. A browser program adds `ESNext.Disposable` to its own
`lib` only once the browsers it targets ship explicit resource management, so no `@codefast/typescript-config` preset
lists it. Without the types, a program keeps `skipLibCheck` on, as every preset does, and calls `dispose()` instead of
`await using`.

## Reporting issues

Open an issue with the environment details the bug-report template asks for — Node and package-manager versions, plus
the peers that matter for your package.
