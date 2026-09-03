# Changing the GitHub Projects board configuration

> **Board:** [`orgs/codefastlabs/projects/4`](https://github.com/orgs/codefastlabs/projects/4) · **Project ID:**
> `PVT_kwDOBoFaAM4BfM8Z`
>
> **Updated:** 2026-08-03 · How the board is used: [`guides/github-project-board.md`](../guides/github-project-board.md)

The procedure for changing fields / workflows / views without breaking the configuration. Every item below is a trap
that has actually been sprung once.

---

## Preparation

The `gh` token needs the project scopes:

```bash
gh auth refresh -s project,read:project
```

Read the entire current state — run this both before and after every change:

```bash
gh api graphql -f query='{ organization(login:"codefastlabs"){ projectV2(number:4){
  fields(first:20){ nodes{ ... on ProjectV2SingleSelectField { id name options{ id name } } } }
  views(first:10){ nodes{ number name layout filter groupByFields(first:2){nodes{... on ProjectV2FieldCommon{name}}} } }
  workflows(first:20){ nodes{ name enabled } } } } }'
```

---

## Adding/changing single-select options — **you must pass the existing option's `id`**

`updateProjectV2Field` **replaces the entire** option list. Passing only a `name` for an option that already exists
**creates a completely new option**, and every workflow pointing at the old one **loses its target** — they show a red
warning icon and stop working until each is reconfigured.

**Step 1** — get the `id` of each existing option:

```bash
gh api graphql -f query='{ organization(login:"codefastlabs"){ projectV2(number:4){ fields(first:20){ nodes{
  ... on ProjectV2SingleSelectField { id name options{ id name color description } } } } } } }'
```

**Step 2** — send back the **full** list, keeping the `id` for existing options and omitting it for new ones:

```bash
gh api graphql -f query='mutation { updateProjectV2Field(input:{
  fieldId:"PVTSSF_…",
  singleSelectOptions:[
    {id:"e9f49f6d", name:"Inbox",   color:GRAY, description:"Not yet triaged"},
    {              name:"Someday", color:PINK, description:"Deliberately parked"}
  ]}) { projectV2Field { ... on ProjectV2SingleSelectField { options{ name } } } } }'
```

**Step 3** — verify the workflows are intact. `enabled: true` does **not** prove the target is still correct; open the
workflows page and confirm there is **no red warning icon** anywhere.

`color` is an enum: `GRAY` `BLUE` `GREEN` `YELLOW` `ORANGE` `RED` `PINK` `PURPLE`. `name`, `color` and `description` are
all required; `id` is optional.

## Changing a built-in workflow — UI only

GraphQL has **no** mutation to create or edit a built-in workflow (only `deleteProjectV2Workflow`). You have to go to
`…/projects/4/workflows`.

**Saving and enabling are two steps, not one.** The `Save and turn on workflow` button only writes the configuration —
the workflow is **still Off**. You then have to click the toggle in the top right. This is true for every workflow,
whatever the button says about "turn on".

Verify with the `Workflows N` counter in the header, or with:

```bash
gh api graphql -f query='{ organization(login:"codefastlabs"){ projectV2(number:4){ workflows(first:20){ nodes{ name enabled } } } } }'
```

An enabled workflow **jumps to the top of the sidebar**, so the positions shift after each one you enable — read the
labels again rather than remembering coordinates.

## Changing the auto-add filter

In the UI: `Auto-add to project` → `Edit` → the Filters box.

**The supported fields differ from ordinary GitHub search:**

| Syntax                 | Supported?                                        |
| ---------------------- | ------------------------------------------------- |
| `is:issue` `is:open`   | ✅                                                |
| `-label:x`             | ✅                                                |
| `kind:idea,learn`      | ✅ a custom field, used for view filters          |
| `author:` / `-author:` | ❌ `Invalid filter: Unknown field names "author"` |
| `-head:branch-name`    | ❌ unverified, assumed not                        |

There is no autocomplete suggesting fields. The UI shows a red error right under the box when the syntax is wrong — use
that as your check.

<a id="view-group-by"></a>

## Changing a view's group-by — UI, and there is a confirmation dialog

GraphQL **cannot** set group-by (`ProjectV2ViewConfigurationInput` only accepts `visibleFieldIds`).

In the UI: open the view → the `View` button (the gear, top right) → `Group by` → pick the field → **`Save view`** (in
that same menu, not the tab's menu) → **click `Save` in the confirmation dialog** _"Saving these display options will
make it the default for everyone in this view"_.

Skip the dialog step and the change is **not saved**, and a reload loses it. A green dot on the `View` gear means there
are unsaved changes.

An empty board (0 items) **shows no group headers**, so you cannot confirm it by eye. Verify through the API:

```bash
gh api graphql -f query='{ organization(login:"codefastlabs"){ projectV2(number:4){ views(first:10){ nodes{
  number name groupByFields(first:2){ nodes{ ... on ProjectV2FieldCommon { name } } } } } } } }'
```

## Creating/deleting a view — the API works

`createProjectV2View` takes `projectId`, `name`, `layout` (`BOARD_LAYOUT` · `TABLE_LAYOUT` · `ROADMAP_LAYOUT`) and
`configuration`. It does **not** take `filter` — that needs `updateProjectV2View` as a second step.

```bash
gh api graphql -f query='mutation { createProjectV2View(input:{
  projectId:"PVT_kwDOBoFaAM4BfM8Z", name:"Ideas", layout:TABLE_LAYOUT
}) { projectV2View { id number } } }'

gh api graphql -f query='mutation { updateProjectV2View(input:{
  viewId:"PVTV_…", filter:"kind:idea,learn"
}) { projectV2View { number filter } } }'
```

Group-by still has to be done in the UI, per [Changing a view's group-by](#view-group-by).

Deleting a view: `deleteProjectV2View(input:{viewId:"…"})` — it returns only `clientMutationId`, not the deleted view.
**A view number is never reissued** after a deletion, so the numbering will have gaps.

## Changing the project README / description

```bash
gh api graphql -F readme=@docs/…/file.md -f query='mutation($readme:String!) {
  updateProjectV2(input:{ projectId:"PVT_kwDOBoFaAM4BfM8Z", readme:$readme,
    shortDescription:"…" }) { projectV2 { shortDescription } } }'
```

`updateProjectV2Input` takes: `title` `shortDescription` `readme` `closed` `public`.

## Draft issues

```bash
# create
gh api graphql -f query='mutation { addProjectV2DraftIssue(input:{
  projectId:"PVT_kwDOBoFaAM4BfM8Z", title:"…", body:"…"
}) { projectItem { id type } } }'

# delete
gh api graphql -f query='mutation { deleteProjectV2Item(input:{
  projectId:"PVT_kwDOBoFaAM4BfM8Z", itemId:"PVTI_…"
}) { deletedItemId } }'
```

A draft issue **is handled by the workflows like any other item** — it gets `Status: Inbox` when added, and
`Auto-close issue` closes it if it moves to `Done`.

Promoting a draft to a real issue: `convertProjectV2DraftIssueItemToIssue`.

## If the board is private, the browser tool must be signed in

A private board returns **404** to anonymous access — that is not a wrong path. Before concluding the URL is wrong,
check the sign-in state of the exact browser being driven: each browser/profile has its own session, and a tab open in
another profile **does not share cookies**.
