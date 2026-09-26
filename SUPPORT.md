# Support policy

## Node.js

The `@codefast/*` packages support **Node.js 24.0.0 or later**. That is the first release with explicit resource
management built in (`using`, `await using`, `DisposableStack`, `AsyncDisposableStack`, `SuppressedError`) and all of
ES2025, so the packages can rely on both as the platform ships them, with no shim. The repo targets modern runtimes
rather than the widest audience, so an older line stays unsupported even while it is maintained. The floor rises, by a
`minor`, when its line reaches [end-of-life](https://github.com/nodejs/release#release-schedule) or when the packages
need a feature only a newer line ships — and only to a line that the serverless runtimes they deploy to offer.

| Line    | Role            | Status                      |
| ------- | --------------- | --------------------------- |
| Node 22 | Maintenance LTS | Not supported               |
| Node 24 | Active LTS      | Supported — `engines` floor |
| Node 26 | Current         | Supported                   |

`engines.node` is `>=24.0.0` on every package, and the floor is enforced mechanically rather than by convention:

- **`@types/node`** is pinned to the floor's major (`^24`), so a Node API newer than the floor is a type error.
  Dependabot ignores its major updates (`.github/dependabot.yml`), so the pin moves only when the floor does.
- **`lib` and `target`** are `ES2025`, the newest edition Node 24 fully supports, and `lib` adds `ESNext.Disposable`,
  which Node 24 ships natively. A builtin newer than both, such as `Map.prototype.getOrInsert`, is a type error rather
  than a runtime crash.
- **Internal subpath imports** use a bare `#` prefix (`#core/token`), which Node's ESM resolver accepts on every
  supported line — `#/`-prefixed specifiers are rejected below Node 24.14.
- **CI** develops on the Current line (`.node-version`) for speed, and a matrix runs the unit suite on the floor itself,
  `24.0.0`, so the floor is a contract CI proves. `codefast audit publish` statically checks the publish surface — no
  `#/` imports, and every `exports`/`imports` target ships.

Development uses the latest Node for speed and tooling; nothing about the contributor's local Node version can leak into
the published packages, because the floor is checked by the compiler and by CI. A contributor's local Node must be at
least the floor, which also covers the Node the repo's own toolchain (pnpm) needs.

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
types. `@types/node` 24 or later loads them, and every `@codefast/typescript-config` preset lists `ESNext.Disposable` in
`lib`. Any other program adds `ESNext.Disposable` to its own `lib`.

## Reporting issues

Open an issue with the environment details the bug-report template asks for — Node and package-manager versions, plus
the peers that matter for your package.
