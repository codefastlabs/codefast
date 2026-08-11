---
name: commit
description: Group changes by relatedness and commit each group separately (Conventional Commits)
disable-model-invocation: true
allowed-tools:
  - Bash(git status *)
  - Bash(git diff *)
  - Bash(git log *)
  - Bash(git add *)
  - Bash(git commit *)
  - Bash(pnpm run check-types)
---

# Commit related changes in groups

Goal: do NOT commit every file in a single commit. Instead, group changes by logical relatedness and create one commit per group.

## Process

1. **Survey the changes**
   - `git status --short` to list changed files (staged, unstaged, and untracked).
   - `git diff` and `git diff --staged` to understand what each change actually does, not just the file names.
   - If files are already staged, analyze them like any other change.

2. **Group by relatedness**
   Cluster files into independent groups by the _meaning_ of the change, not by directory. Suggested criteria:
   - Changes belonging to the same feature / fix / refactor / concern go together.
   - Keep separate: config/tooling changes, docs, tests, codegen output, lockfile/dependency bumps.
   - A change and its accompanying test should live in the same group.
   - If a single file mixes unrelated changes, split it by hunk **without** interactive git: send
     `git diff -- <file>` to a patch file, delete the hunks belonging to other groups, then
     `git apply --cached <patch>` to stage only what remains. The deleted hunks stay unstaged and
     are picked up by a later group.

3. **Quality check before committing (REQUIRED)**
   - Run `pnpm run check-types`.
   - If it fails: read the output, fix the code, and rerun until clean. Do NOT commit while check-types is failing.
   - After fixing (if any), re-survey `git status` since new changes may have appeared that need grouping.

4. **Commit each group — automatically, no confirmation**
   For each group, in a sensible order (e.g. deps/config first, then features, then tests, then docs):
   - `git add <only the files for this group>` (or the `git apply --cached` hunk split above).
   - `git commit -m "<message>"` following the repo's Conventional Commits style:
     - Format: `type(scope): short imperative description, in English, lowercase`.
     - `type`: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `build`, `ci`, `style`.
     - `scope`: the related package/app, e.g. `web`, `ui` (omit when the change spans many).
     - Check `git log --oneline -20` to match the existing tone.
   - Repeat until `git status` is clean (except files the user intentionally left out).

5. **Report the result**
   - List the commits created (short hash + subject) and the files in each group.
   - If any files were left out (e.g. junk files, files that should not be committed), call them out and explain why.

## Constraints

- Do NOT `git push` unless the user asks.
- Do NOT use `git add -A` / `git add .` for everything at once — always stage exactly the files of each group.
- Interactive git is unavailable here — no `git add -p`, `git add -i`, or `git rebase -i`. Hunk-level
  staging goes through the `git apply --cached` patch route.
- Do NOT edit code just to "make grouping look nicer"; only edit when check-types reports an error.
- Each commit should compile/type-check independently where possible (don't split commits in a way that breaks type-check midway when the changes depend on each other — in that case, put them in the same group).
