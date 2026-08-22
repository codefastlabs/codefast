# The GitHub Projects board — how it works and how to use it

> **Board:** [`orgs/codefastlabs/projects/4`](https://github.com/orgs/codefastlabs/projects/4) — private, linked into
> `codefastlabs/codefast`
>
> **Updated:** 2026-08-03 · Why it is designed this way:
> [`decisions/github-project-board.md`](../decisions/github-project-board.md) · Changing the configuration:
> [`runbooks/github-project-maintenance.md`](../runbooks/github-project-maintenance.md)

This board is a **repo-level Projects v2 board hosted at org level**. `github.com/codefastlabs/codefast/projects` is
only the page listing the projects linked into the repo — Projects (classic) has been killed off by GitHub, and no board
lives at repo level any more.

---

## 1. The model in one sentence

**The board tracks issues, not PRs.** An issue moves from `Inbox` down to `Done` almost entirely automatically; a PR
only affects the status of the issue it is linked to, and never appears as a card itself.

## 2. Fields

| Field     | Type          | Meaning                                                                                                     |
| --------- | ------------- | ----------------------------------------------------------------------------------------------------------- |
| `Status`  | single-select | The stage in the workflow — see §3                                                                          |
| `Package` | single-select | `ui` · `di` · `tailwind-variants` · `theme` · `tracking` · `cli` · `benchmark` · `apps/ui` · `repo-tooling` |
| `Kind`    | single-select | `feat` · `fix` · `perf` · `docs` · `dx` · `chore` · `idea` · `learn`                                        |
| `Target`  | text          | **Which downstream project needs this.** Not a version milestone — versions are per package                 |

`Package` is the most important field: the standing question in a monorepo is _"what is still outstanding in which
package"_, and three of the four views group by it.

The first six `Kind` options match Conventional Commits (which commitlint enforces), so an issue's `Kind` usually
becomes the commit prefix directly.

`Kind` and `Target` have **no workflow filling them in** — set them by hand at triage.

## 3. Status — six stages

| Stage         | Meaning             | Who sets it                          | Rule                                              |
| ------------- | ------------------- | ------------------------------------ | ------------------------------------------------- |
| `Inbox`       | not yet triaged     | automatic, when an item is added     | **empty every week** — either to `Next`, or close |
| `Someday`     | deliberately parked | by hand                              | re-read every release: _"is this still right?"_   |
| `Next`        | committed to        | by hand                              | **the order in the column is the priority**       |
| `In progress` | being worked on     | by hand                              | **WIP = 1** — no other column may hold 2 items    |
| `In review`   | a PR is open        | automatic, when a PR links an issue  | —                                                 |
| `Done`        | finished            | automatic, on issue close / PR merge | dragging here by hand **closes the issue**        |

Three rules keep the board from rotting, and dropping any one of them rots it:

1. **WIP = 1.**
2. **`Inbox` is empty every week.**
3. **An item sitting in `Next` untouched for 30 days → close it.** If it has not been done in 30 days, it is not `Next`.

> To park an idea use `Someday`, **not `Done`** — `Done` will close draft issues too.

## 4. The seven automated workflows

| Workflow                       | Trigger                          | Action                 |
| ------------------------------ | -------------------------------- | ---------------------- |
| `Auto-add to project`          | an issue matches the filter (§5) | add it to the board    |
| `Item added to project`        | an item reaches the board        | `Status: Inbox`        |
| `Pull request linked to issue` | a PR is linked to an issue       | `Status: In review`    |
| `Item closed`                  | an issue/PR closes               | `Status: Done`         |
| `Pull request merged`          | a PR merges                      | `Status: Done`         |
| `Auto-close issue`             | `Status` changes to `Done`       | **close the issue**    |
| `Auto-add sub-issues`          | an item has sub-issues           | add the sub-issues too |

The last two close the loop in both directions: closing an issue moves its card to `Done`, and dragging a card to `Done`
closes the issue. There is no status left to fix by hand.

`Pull request linked to issue` **does not pull the PR onto the board** — it sets a field on the **issue**. That is why
the board can know an issue is awaiting review without containing any PRs.

## 5. What reaches the board, and what does not

The `Auto-add to project` filter:

```
is:issue is:open -label:dependencies -label:github-actions
```

**Issues only.** The direct consequences:

- Dependabot PRs (~10/week, grouped, auto-merged except majors) **do not reach the board** — they need no status.
- The Changesets `chore: release new version` PR **does not reach the board** — it is a checkpoint, not a task.
- **Your own PRs do not reach the board either.** A small PR with no linked issue is invisible to the board — that is
  deliberate, not an oversight.

## 6. Ideas, learning goals, and vision

These three kinds of content have **different ending conditions**, so they live in different places:

| Kind              | Where it lives                                      | Why                                                                                  |
| ----------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Vision**        | The project README (Settings tab)                   | A vision is never `Done`                                                             |
| **Idea**          | a **draft issue**, `Kind: idea`, `Someday`          | No issue in the repo: no burnt number, no notification, no leaking before it is ripe |
| **Learning goal** | a draft issue `Kind: learn` (if it serves the repo) | Purely personal learning, unrelated to the repo, does not belong in this project     |

A **draft issue** is the mechanism most worth using here: the item lives on the board with a full
`Package`/`Kind`/`Target`, yet the repo stays clean. Verified: a draft issue **still gets `Status: Inbox` from
`Item added to project`**, so it joins the existing flow with no separate workflow.

When an idea ripens → **Convert to issue**, and the workflows take over from there.

Creating a draft quickly through the API:

```bash
gh api graphql -f query='mutation { addProjectV2DraftIssue(input:{ projectId:"PVT_kwDOBoFaAM4BfM8Z", title:"…", body:"…" }) { projectItem { id } } }'
```

## 7. The four views

| #   | View         | Layout | Group     | Filter              | Use it for                                     |
| --- | ------------ | ------ | --------- | ------------------- | ---------------------------------------------- |
| 1   | `Board`      | board  | `Status`  | —                   | the default view, day-to-day work              |
| 2   | `By package` | table  | `Package` | —                   | _"what is still outstanding in which package"_ |
| 3   | `Perf`       | table  | `Package` | `label:performance` | the regression → benchmark → changeset loop    |
| 5   | `Ideas`      | table  | `Package` | `kind:idea,learn`   | re-read every release                          |

The view numbers jump from 3 to 5 because the `Roadmap` view (number 4) was deleted — see
[decisions](../decisions/github-project-board.md).

The `Perf` view lines up with existing infrastructure: the `performance` label, the
`.github/ISSUE_TEMPLATE/performance-regression.yml` issue template, and `benchmarks/*`.

## 8. The operating rhythm

| Rhythm           | What to do                                                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Weekly**       | Get `Inbox` back to empty. For each item: move it to `Next`, or close it.                                                    |
| **Each release** | Read through `Someday` (the `Ideas` view) and ask each item exactly one question: _"is this still right?"_ If not, close it. |
| **At all times** | `In progress` holds at most 1 item.                                                                                          |

The `Someday` re-read is **attached to the release rather than creating a new rhythm** — an idea list with no re-read
rhythm is worth nothing, and an idea sitting untouched for eight months adds noise to every visit to the board.
