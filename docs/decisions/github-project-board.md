# GitHub Projects board design — decision record

**Date:** 2026-08-03 · **Status:** settled and implemented · **Board:**
[`orgs/codefastlabs/projects/4`](https://github.com/orgs/codefastlabs/projects/4)

A record of what was chosen, why, and — most importantly — **which GitHub Projects limits forced a redesign midway**.
How to use the board is in [`guides/github-project-board.md`](../guides/github-project-board.md).

---

## 1. The context at design time

The state of the repo when the board was built, because it decided nearly every choice:

- **0 open issues**, and one single PR: the `chore: release new version` bot
- Dependabot running weekly and grouped, with **auto-merge** except for majors
  (`.github/workflows/dependabot-auto-merge.yml`)
- 9 packages + 1 app + 2 benchmark suites, one maintainer
- Labels almost entirely default, with only `dependencies`, `github-actions` and `performance` added

With 0 issues and one person working, a Jira-style board with 8 fields would be dead in two weeks. **Every field is a
tax paid on every item**, so exactly 4 were settled on.

## 2. The decisions

### 2.1 An org-level board, not a repo-level one

Projects (classic) has been killed off. `github.com/codefastlabs/codefast/projects` is only a listing page. The real
board lives at `orgs/codefastlabs/projects/4` and is linked into the repo — with the upside that it can later span
several of the org's repos.

### 2.2 Four fields, no more

`Status` · `Package` · `Kind` · `Target`.

**`Priority` and `Size` were dropped.** With one person working, **the order within the `Next` column is the priority**
— dragging is cheaper than setting a field. `Size` is not used to plan for anyone, so it is pure tax.

`Package` is kept because this is a monorepo: the real day-to-day question is _"what is still outstanding in which
package"_, not _"what priority is this issue"_.

### 2.3 Auto-add issues only, never PRs

> **This was forced by the platform, not the original choice.**
>
> The first design auto-added both issues and PRs, then excluded bots with
> `-author:app/dependabot -author:app/github-actions`. GitHub **refused**:
>
> ```
> Invalid filter: Unknown field names "author", "author"
> ```
>
> A project's auto-add filter **does not support `author:`**. There is no autocomplete either, to find out which fields
> are supported.

The replacement: accept issues only.

```
is:issue is:open -label:dependencies -label:github-actions
```

Both Dependabot PRs and the release PR are PRs, so they are all excluded **without needing `author:`**. The release PR
carries no label at all, so if PRs were still wanted there would be no way to filter it out on its own.

**The accepted trade-off:** the maintainer's own PRs do not reach the board either. A small PR with no linked issue is
invisible. For a one-person repo, a PR that merges the same day does not need a status.

This is offset by the `Pull request linked to issue` workflow → the issue moves to `In review` by itself. Worth spelling
out, because it is easy to misread: that workflow **sets a field on the issue**, it does **not** pull the PR onto the
board.

### 2.4 Adding a `Someday` stage

The first `Status` set had 5 stages: `Inbox → Next → In progress → In review → Done`.

That set **conflicted with its own rule**: the rule says _"`Inbox` is empty every week"_, but ideas need to be parked
for months. Park an idea in `Inbox` and the rule dies in week one — which is exactly when a board starts to rot.

Adding `Someday` resolves the conflict: `Inbox` = not yet triaged (empty every week), `Someday` = deliberately parked
(re-read every release), `Next` = committed to.

### 2.5 Ideas and learning goals are draft issues

Not real issues: they burn no issue number, send no notifications, and leak nothing publicly before they are ripe.

Verified experimentally (create a draft → read the field → delete): a draft issue **still gets `Status: Inbox` from
`Item added to project`**, so no separate workflow is needed.

Purely personal learning, unrelated to the repo, **does not belong in this project** — mixing "learn Rust" with "fix RTL
for Tooltip" destroys the very signal the board exists to give: _what can actually ship_.

### 2.6 Turning on `Auto-close issue`

Drag a card to `Done` → the issue closes itself. Together with `Item closed` → `Done`, the loop is closed in both
directions, with no idempotency loop because both ends converge.

**A side effect worth knowing:** it applies to draft issues too. That is why §3 of the guide stresses parking ideas in
`Someday` rather than `Done`.

### 2.7 Deleting the `Roadmap` view

Created, then deleted. Two reasons:

1. **It does not work technically.** The Roadmap layout needs a **DATE** field to draw its time bars. `Target` is
   **TEXT**, so items appear but have no position on the timeline.
2. **Its reason for existing went away.** The original reason was a public roadmap for outsiders to read. The project is
   **private**, so that reason is gone.

Keeping it would only be a dead tab. If a timeline is genuinely needed later: add a `Target date` field of type DATE, do
not change `Target`.

### 2.8 `Target` means a downstream project, not a version milestone

This is an **internal-first project**, and each package versions independently — so a 1.0 would be one package's own
decision, never a repo-wide milestone a board field could track.

So the right question each release is not _"are we at 1.0 yet"_ but _"which downstream project is waiting on what"_.
`Target` answers that one.

A note alongside it: the evidence in the repo (npm `access: public`, the codefastlabs.com doc site,
downloads/bundle-size badges) all points at "a public product" — **the opposite of the real intent**. That is exactly
why this has to be written down rather than left for each reader to re-infer from the repo.

### 2.9 Keeping the project private

Making it public, so the board could serve as a roadmap for outsiders, was considered. Settled on **private** — it fits
the internal nature of the project, and it is what decision 2.7 follows from.

## 3. GitHub Projects limits encountered

Recorded so they do not have to be rediscovered:

| Limit                                                                       | Consequence                                                                      |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| The auto-add filter **does not support `author:`**                          | Bots cannot be excluded by author → decision 2.3                                 |
| The filter **does** support custom fields (`kind:idea,learn`)               | Verified in the UI, no error                                                     |
| GraphQL **cannot** configure a built-in workflow                            | `deleteProjectV2Workflow` exists but there is no create/update — must use the UI |
| GraphQL **cannot** set a view's group-by                                    | `ProjectV2ViewConfigurationInput` only accepts `visibleFieldIds`                 |
| `filter` exists only on `updateProjectV2View`, not on `createProjectV2View` | Creating a view then setting its filter is two steps                             |
| The Roadmap layout needs a DATE field                                       | → decision 2.7                                                                   |

## 4. Considered and rejected

- **One project per package** (9 projects) — rejected: it splits one stream of work apart, and the `Package` field
  already covers that need.
- **Putting dependency bumps on the board** — rejected: they auto-merge, and a status column for work that needs no
  decision is pure tax.
- **Using both Milestones and Projects iterations** — rejected: two mechanisms for one job. Releases do not follow a
  schedule, so a text `Target` fits better than a fixed-length iteration.
- **The `good first issue` / `help wanted` labels** — currently meaningless for an internal project, not yet cleaned up.

## 5. Still open

- The public-facing signals on an internal project: npm `access: public`, the doc site, and the two labels above.
  Whether to clean them up or leave them is undecided.
- `Kind` and `Target` have no way to be filled in automatically; if manual triage proves to cost too much, consider a
  workflow that infers `Kind` from the title prefix.
