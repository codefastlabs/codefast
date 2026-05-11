# Guidance for coding agents

Use this file plus repo-root **[`ARCHITECTURE.md`](ARCHITECTURE.md)** to stay aligned across chat sessions.

## Before implementing

1. Read **`ARCHITECTURE.md`** for the monorepo map and dependency direction.
2. For CLI work, read **`packages/cli/ARCHITECTURE.md`** (and **`packages/cli/SPEC.md`** if touching structure or naming).
3. Search the codebase for existing patterns (same feature, similar component, shared utilities) **before** adding parallel implementations.
4. Prefer **`#/`…** package imports where `package.json` defines `imports` (see each package).

## Where to put changes

| Goal                                                  | Primary location             |
| ----------------------------------------------------- | ---------------------------- |
| Shared React components / hooks for the design system | `packages/ui`                |
| Tailwind / variant utilities                          | `packages/tailwind-variants` |
| Theme behavior                                        | `packages/theme`             |
| Docs site only (routes, content, app shell)           | `apps/docs`                  |
| Developer tooling (arrange / mirror / tag)            | `packages/cli`               |

## Verify locally

From repo root: `pnpm check` after substantive edits; run targeted `pnpm test` or package scripts as needed.

# Documentation Comments

- Do not add `@since` tags to new or modified code comments.
- `@since` is release metadata and must only be added during the release process.
- If existing code already has `@since`, preserve it unless explicitly asked to change it.
