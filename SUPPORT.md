# Support policy

## Node.js

Each package declares its own Node.js floor in `engines.node`, set as low as the package can go: the lowest release that
its code, every dependency that runs on it, and its own test suite all support. No package inherits a floor from the
monorepo. The lowest any package can go is **Node.js 22.12**, the first release the test toolchain (Vitest) runs on,
because a floor counts only once CI has run the package's full test suite on that very release. A floor claims every
release from it up, so the code and every dependency it runs on must hold on each of them; the test suite is proven on
the two ends CI runs it on, the floor and the newest release.

| Package                                                      | Floor   | What sets it                                      |
| ------------------------------------------------------------ | ------- | ------------------------------------------------- |
| `@codefast/cli`                                              | 22.12.0 | Vitest, `oxc-parser` and `commander`              |
| `@codefast/tailwind-variants`, `@codefast/typescript-config` | 22.12.0 | Vitest                                            |
| `@codefast/di`, `@codefast/di-testing`                       | 22.18.0 | Babel, which lowers the decorators in their tests |
| `@codefast/theme`, `@codefast/tracking`, `@codefast/ui`      | 22.22.2 | jsdom, which their component tests render in      |

| Line    | Role            | Status                                               |
| ------- | --------------- | ---------------------------------------------------- |
| Node 22 | Maintenance LTS | Supported from each package's floor, 22.12 at lowest |
| Node 24 | Active LTS      | Supported                                            |
| Node 26 | Current         | Supported                                            |

A package's floor moves, by a `minor` of that package, when its code or a dependency needs a newer release, when its
line reaches [end-of-life](https://github.com/nodejs/release#release-schedule), or when it can go lower — and only ever
to a release that CI runs its tests on. Floors are enforced mechanically rather than by convention:

- **`@types/node`** is pinned per floor. `pnpm-workspace.yaml` holds one `node<major>.<minor>` catalog for each floor in
  use, pinning `@types/node` to the newest line that declares nothing the floor lacks — `@types/node` publishes no 22.22
  line, so the 22.22 floor takes 22.20 — and a package names the catalog of its own floor. A Node API newer than the
  floor is then a type error. An override holds every transitive `@types/node` to the lowest floor's line without
  touching the catalogs. Dependabot ignores its major and minor updates (`.github/dependabot.yml`), so a pin moves only
  when its floor does.
- **`lib` and `target`** are `ES2025` in the presets, the newest edition that both Node 24 and the
  [browser floor](#browsers) ship. A package whose floor is on Node 22 layers the `node22.json` or `node22-dom.json`
  overlay from `@codefast/typescript-config`, which narrows both to what Node 22 ships: `ES2024` plus the Set methods
  and iterator helpers. For code that also runs in a browser that is the stricter of the two floors, so it holds both.
- **Node types reach only code that runs on Node.** A package that runs on Node sets `types: ["node"]` in its build
  config. Every other build loads no ambient types, so a Node global in browser or universal code fails the build.
- **Internal subpath imports** use a bare `#` prefix (`#core/token`), which Node's ESM resolver accepts on every
  supported release — `#/`-prefixed specifiers are rejected below Node 24.14.
- **`codefast audit engines`** holds each floor to what runs on it. A published package declares one, written `>=X.Y.Z`.
  Every dependency it installs for a consumer must admit, in its own `engines.node`, every release from the floor up — a
  range with a gap above the floor, such as Babel's `^22.18.0 || >=24.11.0` under a 22.18 floor, fails it. The odd lines
  between the floor's and the newest tested one sit outside that claim: they reach end-of-life within months without
  ever becoming LTS, and dependencies routinely skip them. A dev dependency only runs the package's tests, so its
  `engines.node` must admit the two releases CI runs them on, the floor and the newest (`.node-version`), and a gap
  between them is not one the tests claim. The lockfile must resolve the package's `@types/node` on the floor's major at
  a minor no newer. The workspace root's floor is held to every dependency any package installs, runtime and dev alike,
  from that floor up — a contributor on it builds and tests the whole repo — so jsdom's `^24.15.0` line sets it.
- **CI** develops on the Current line (`.node-version`) for speed, and a matrix runs every test category of each package
  on its own floor — one leg per distinct floor, planned from `codefast audit engines --json`. pnpm is a native binary
  that needs no Node of its own, so a leg runs on nothing newer than its floor. Unit tests run the source through Vite's
  transform, so the integration and end-to-end tests, which load the built packages, are what catch a builtin or a
  syntax the floor lacks. `codefast audit publish` statically checks the publish surface — no `#/` imports, and every
  `exports`/`imports` target ships.

Moving one package's floor touches only that package and whatever depends on it at runtime: add the
`node<major>.<minor>` catalog if none exists yet, set its `engines.node` and its `@types/node` to that catalog, layer
the floor's `lib` overlay if the major changes, raise each package the audit names, and give each a `minor` changeset.

Development uses the latest Node for speed and tooling, and contributors need the root `engines.node` (Node 24.15), the
lowest release every tool any package builds or tests with admits. Nothing about a contributor's local Node version can
leak into the published packages, because each floor is checked by the compiler and by CI on that floor.

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
lists it. Without the types, a program keeps `skipLibCheck` on, as every preset does, and calls `disposeAsync()` instead
of `await using`.

## Reporting issues

Open an issue with the environment details the bug-report template asks for — Node and package-manager versions, plus
the peers that matter for your package.
