# Documentation index

The `docs/` directory is organised by **document type**, not by subject area. The subject area lives in the filename.

Why: the question _"which area does this document belong to?"_ usually has several answers, so splitting by area breeds
a junk drawer. The question _"what type of document is this?"_ has exactly one answer.

---

## Where a new file goes

Work down the list and stop at the first row that is true:

| Question                                                              | Directory    | Lifecycle                                               |
| --------------------------------------------------------------------- | ------------ | ------------------------------------------------------- |
| Is this a **source of truth** that code or another party must follow? | `specs/`     | long-lived, with a clear owner                          |
| Is this **a settled decision plus its reasoning**?                    | `decisions/` | never edited once settled, only superseded by a new one |
| Is this **instructions for doing something**?                         | `guides/`    | long-lived, updated when the system changes             |
| Is this **a repeatable manual procedure**?                            | `runbooks/`  | long-lived                                              |
| Is this **time-boxed work with a checklist**?                         | `plans/`     | closed when it is finished                              |
| Is this **a snapshot of one moment**?                                 | `reports/`   | never updated, only joined by a newer one               |

Only create a directory once there is a file that genuinely belongs in it — do not stand up empty directories "for
completeness".

### Naming convention

- kebab-case, no diacritics, no redundant suffix: `github-project-board.md`, not `github-project-board-guide.md` (it is
  already in `guides/`)
- The same subject may appear under several types — `guides/github-project-board.md` and
  `decisions/github-project-board.md` are two different documents about the same thing, and that is fine
- `reports/` puts the time in the name: `security-status-2026-05.md`

---

## decisions/ — decisions and their reasoning

A record of what was chosen and why. Never edit the old content; if a decision changes, write a new one and link back.

| File                                                           | Content                                                                                             |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [`github-project-board.md`](decisions/github-project-board.md) | The GitHub Projects board design: what was chosen, why, and which platform limits forced a redesign |

## guides/ — how to do things

| File                                                        | Content                                          |
| ----------------------------------------------------------- | ------------------------------------------------ |
| [`github-project-board.md`](guides/github-project-board.md) | How the board works and how to use it day to day |

## runbooks/ — operational procedures

| File                                                                      | Content                                                                            |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [`github-project-maintenance.md`](runbooks/github-project-maintenance.md) | Changing the board's fields / workflows / views without breaking the configuration |

## reports/ — snapshots of one moment

Never updated once written; a later snapshot joins it rather than replacing it.

| File                                                                       | Content                                                                     |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [`documentation-audit-2026-08.md`](reports/documentation-audit-2026-08.md) | Classification of every authored `.md` by type, and the corrections applied |

---

## Documents that live inside a package

A document that concerns exactly one package stays in that package rather than moving into `docs/`:

- `packages/di/ARCHITECTURE.md` — the source of truth for `resolution/`, read it before touching a hot path; what each
  shape costs is measured empirically by the `benchmarks/di-inversify` suite rather than recorded in a doc alongside it
- `packages/di/LEARNING.md` — a guided read of the patterns, algorithms, and TypeScript/performance techniques the
  engine applies, for someone learning from the codebase
- `packages/tracking/spec/` — the behavioural contract
- `packages/*/DECISIONS.md` — a settled design/architecture decision for that package (the package-local mirror of
  `decisions/` above): `packages/cli/DECISIONS.md`, `packages/tailwind-variants/DECISIONS.md`
- `packages/*/README.md`, `packages/*/CHANGELOG.md`

`docs/` is for documents that cut across several packages, or that are about the infrastructure around the repo (the
board, processes, operations).

The root documents have their own role and do not move here: [`CLAUDE.md`](../CLAUDE.md) (instructions for agents),
[`TESTING.md`](../TESTING.md), [`CONTRIBUTING.md`](../CONTRIBUTING.md).
