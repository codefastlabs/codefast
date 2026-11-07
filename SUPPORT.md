# Support policy

## Node.js

Every published `@codefast/*` package declares the same Node.js floor in `engines.node`: **Node.js 24.15**. The packages
are built to work together, and an app that installs several of them runs on the highest floor any of them declares, so
a lower floor on one package would promise nothing a consumer could use. 24.15 is the first release every tool the
packages build and test with runs on — jsdom, which the component tests render in, sets it — and a floor counts only
once CI has run the full test suite on that very release.

| Line    | Role            | Status               |
| ------- | --------------- | -------------------- |
| Node 22 | Maintenance LTS | Not supported        |
| Node 24 | Maintenance LTS | Supported from 24.15 |
| Node 26 | Active LTS      | Supported            |

The floor moves for every package at once, by a `minor` of each, when code or a dependency needs a newer release or when
its line reaches [end-of-life](https://github.com/nodejs/release#release-schedule), and only ever to a release CI runs
the tests on. It is enforced mechanically rather than by convention:

- **`@types/node`** is pinned in the default catalog to the newest line that declares nothing the floor lacks —
  `@types/node` publishes no 24.15 line, so it takes 24.13 — and an override holds every transitive `@types/node` to the
  same line. A Node API newer than the floor is then a type error. Dependabot ignores its major and minor updates
  (`.github/dependabot.yml`), so the pin moves only when the floor does.
- **`lib` and `target`** are `ES2025` in the presets, the newest edition that both Node 24 and the
  [browser floor](#browsers) ship.
- **Node types reach only code that runs on Node.** A package that runs on Node sets `types: ["node"]` in its build
  config. Every other build loads no ambient types, so a Node global in browser or universal code fails the build.
- **Internal subpath imports** use a bare `#` prefix (`#core/token`), which Node's ESM resolver accepts on every
  supported release — `#/`-prefixed specifiers are rejected below Node 24.14.
- **`codefast audit engines`** holds the floor to what runs on it. A published package declares it, written `>=X.Y.Z`,
  and every published package declares the same one. Every dependency a package installs for a consumer must admit, in
  its own `engines.node`, every release from the floor up; the odd lines between the floor's and the newest tested one
  sit outside that claim, since they reach end-of-life within months without ever becoming LTS. A dev dependency only
  runs the tests, so its `engines.node` must admit the two releases CI runs them on, the floor and the newest
  (`.node-version`). The lockfile must resolve `@types/node` on the floor's major at a minor no newer. The workspace
  root's floor, which contributors need, is held to every dependency any package installs, runtime and dev alike.
- **CI** develops on the newest line (`.node-version`) for speed, and a matrix leg runs every test category of each
  package on the floor itself, planned from `codefast audit engines --json`. pnpm is a native binary that needs no Node
  of its own, so the leg runs on nothing newer than the floor. Unit tests run the source through Vite's transform, so
  the integration and end-to-end tests, which load the built packages, are what catch a builtin or a syntax the floor
  lacks. `codefast audit publish` statically checks the publish surface — no `#/` imports, and every `exports`/`imports`
  target ships.

Development uses the latest Node for speed and tooling, and contributors need the root `engines.node`. Nothing about a
contributor's local Node version can leak into the published packages, because the floor is checked by the compiler and
by CI on that floor.

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
- **`@codefast/cli`** declares it as an optional `typescript` peer (`>=7.0.0`), which only `audit props` loads.
- **The other packages** state it in their README and declare no `typescript` peer.

Explicit resource management enters the language in ES2027, so no numbered `lib` declares it yet. `@codefast/di` and
`@codefast/di-testing` name its symbols and interfaces in their declarations, so a program that uses them needs its
types. A Node program gets them from `@types/node`. A browser program adds `ESNext.Disposable` to its own `lib` only
once the browsers it targets ship explicit resource management, so no `@codefast/typescript-config` preset lists it.
Without the types, a program keeps `skipLibCheck` on, as every preset does, and calls `disposeAsync()` instead of
`await using`.

## Reporting issues

Open an issue with the environment details the bug-report template asks for — Node and package-manager versions, plus
the peers that matter for your package.
