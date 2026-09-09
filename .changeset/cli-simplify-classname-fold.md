---
"@codefast/cli": minor
---

Fix `codefast arrange simplify` changing rendered output: a mixed `cn()` call moved every static literal to the front,
which flipped tailwind-merge precedence and dropped overrides that sat after a variant call. It now coalesces only
adjacent static literals and preserves argument order.

Add `codefast arrange simplify --fold-variant-classname` (alias `--fold-variant-class-name`), which folds
`cn(buttonVariants({ size: "sm" }), "flex-1")` into `buttonVariants({ size: "sm", className: "flex-1" })`. The fold is
gated on the native TypeScript type server confirming the callee accepts a `className`/`class`, so it loads the
`typescript` package (a new optional peer, v7) and applies only inside a `tsconfig`; the default pass is unchanged.
