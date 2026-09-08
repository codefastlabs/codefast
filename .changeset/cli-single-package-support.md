---
"@codefast/cli": minor
---

Support single-package projects, not just pnpm workspaces. Commands now resolve their root by walking up from the
current directory: the nearest `pnpm-workspace.yaml` marks a workspace (every package under it is in scope), and with no
workspace file the nearest `package.json` marks a single package (that one package is the whole scope). Previously every
command except `arrange group` required a `pnpm-workspace.yaml` and exited otherwise. The root now follows where you run
the CLI (cwd) rather than where the CLI is installed. `arrange` also recognizes `cn` / `tv` imported from `#/lib/utils`.
