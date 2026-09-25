# Support policy

## Node.js

The `@codefast/*` packages support the Node.js **Active LTS** and **Maintenance LTS** lines, and are tested against the
**Current** line. The floor is the lowest still-maintained LTS; a line is dropped once it reaches
[end-of-life](https://github.com/nodejs/release#release-schedule), which raises the floor by a `minor`.

| Line        | Role            | Status                      |
| ----------- | --------------- | --------------------------- |
| Node 22.12+ | Maintenance LTS | Supported — `engines` floor |
| Node 24     | Active LTS      | Supported                   |
| Node 26     | Current         | Tested                      |

`engines.node` is `>=22.12.0` on every package, and the floor is enforced mechanically rather than by convention:

- **`@types/node`** is pinned to the floor's major (`^22`), so a Node API newer than the floor is a type error.
  Dependabot ignores its major updates (`.github/dependabot.yml`), so the pin moves only when the floor does.
- **`lib` and `target`** are `ES2024` (the newest edition Node 22.12 fully supports), so an ES2025 builtin is a type
  error rather than a runtime crash.
- **Internal subpath imports** use a bare `#` prefix (`#core/token`), which Node's ESM resolver accepts on every
  supported line — `#/`-prefixed specifiers are rejected below Node 24.14.
- **CI** develops on the Current line (`.node-version`) for speed, and a matrix runs the unit suite on the Maintenance
  and Active LTS lines, so the floor is a contract CI proves. `codefast audit publish` statically checks the publish
  surface — no `#/` imports, and every `exports`/`imports` target ships.

Development uses the latest Node for speed and tooling; nothing about the contributor's local Node version can leak into
the published packages, because the floor is checked by the compiler and by CI. The published packages run on Node
22.12+, but the repo's own toolchain (pnpm) needs Node 22.13+, so a contributor's local Node must be at least 22.13.

## Reporting issues

Open an issue with the environment details the bug-report template asks for — Node and package-manager versions, plus
the peers that matter for your package.
