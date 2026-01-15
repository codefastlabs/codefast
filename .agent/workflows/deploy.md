---
description: Deploy the application to Vercel
---

## Preview Deployment

```bash
pnpm deploy:preview
```

This deploys to Vercel with archive compression enabled.

## Production Deployment

Production deployments are triggered automatically via GitHub integration when pushing to `main` branch.

## Local Production Build

Build and start locally:

// turbo
```bash
pnpm build
```

```bash
pnpm --filter @apps/start start
```

## Preview Mode

```bash
pnpm --filter @apps/start preview
```
