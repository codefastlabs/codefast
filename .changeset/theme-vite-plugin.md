---
"@codefast/theme": minor
---

Add the `@codefast/theme/vite` plugin. TanStack Start registers the server functions shipped in `@codefast/theme/start` at the consumer's build time, so the package must not be externalized for SSR nor pre-bundled for the client. The new `codefastTheme()` plugin applies that configuration automatically, so consumers no longer need to hand-write `ssr.noExternal` / `optimizeDeps.exclude`.
