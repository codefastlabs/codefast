---
description: Create a release with changesets
---

## 1. Create Changeset

```bash
pnpm release
```

Follow prompts to:
- Select changed packages
- Choose bump type (patch/minor/major)
- Write changelog summary

## 2. Verify Build

// turbo
```bash
pnpm build:packages
```

// turbo
```bash
pnpm test
```

// turbo
```bash
pnpm lint
```

## 3. Commit Changes

```bash
git add .
git commit -m "chore: add changeset for release"
```

## Canary Releases

Enter canary mode:
```bash
pnpm release:canary:enter
```

Exit canary mode:
```bash
pnpm release:canary:exit
```

## Notes

- `@codefast/*` packages use **fixed versioning** (released together)
- Apps (`@apps/start`) are excluded from publishing
- Changesets are committed to `.changeset/` directory
