<!--
Prose and tables are welcome — the headings below are a floor, not a form.
Delete any section that does not apply.
-->

## Summary

What this changes and why. Lead with the reason if it is not obvious from the diff.

## Verification

What you ran, not just what you changed.

```bash
pnpm verify
```

<!--
Changed a public API surface? Also verify a consumer's PRODUCTION build — client
import-protection and prerendering only surface there:
  pnpm build:packages && pnpm --filter @apps/ui build
-->

## Performance — delete unless a hot path changed

Numbers and the command that produced them. Include the IQR column; a ratio without it cannot be judged.

```bash
pnpm --filter @codefast/benchmark-di-inversify bench:isolate
```

Confirm the method: process isolation, at least 3 trials per side, baseline stashed and rebuilt on this machine, best-of
rather than one median, each library in its own process. Say which of those you could not do.

If a claim in an earlier revision of this PR turned out to be wrong, retract it here rather than editing it out — how it
happened is usually the reusable part.

## Checklist

- [ ] Changeset added (`pnpm exec changeset`) if a published package changed — `minor` at most, never `major` while on
      0.x
- [ ] Tests live under exactly one of `tests/{unit,integration,e2e,types}/**`, mirroring the `src/` path
- [ ] No hand-written `@since` tags (`git diff | grep -E '^\+.*@since'` is empty — `codefast tag` stamps them at
      release)
- [ ] Comments state the _why_ in three lines or fewer, with no numbers and no history
- [ ] `package.json#exports` regenerated (`pnpm cli:mirror`) if a module was added, moved, or renamed
- [ ] New or changed public API audited against the naming rubric in
      [CLAUDE.md](../CLAUDE.md#api-naming-swift-api-design-guidelines-adapted-to-ts)
