---
name: react-19
description:
  Authoritative reference for writing, reviewing, and migrating React 19 (through 19.3) code — the version-correct API,
  the idioms that replaced React 18 patterns, and the breaking changes between the two. Use whenever writing or
  reviewing React components, hooks, refs, Context, forms/Actions, Suspense, metadata, or SSR/preloading code; whenever
  you are about to reach for `forwardRef`, `Context.Provider`, `propTypes`, `defaultProps`, `ReactDOM.render`, or
  `use(...)`; whenever a snippet's React version is unclear; and whenever migrating code from React 18 to 19. Ground
  every React example in the installed React version, not trained-in 18 habits.
---

# React 19

React 19 changed enough of the everyday API surface — refs, Context, forms, metadata, error handling — that trained-in
React 18 habits are now wrong. This skill exists so React you write or review lands **19-correct on the first pass**,
and so a React 18 pattern is recognized as a migration, not accepted as current.

Three jobs, in priority order:

1. **Default to the current API.** When an idiom changed between 18 and 19, write the 19 form. When a capability is
   newer than 19.0 (19.1 → 19.3), prefer it over the older workaround — once the installed version has it.
2. **Know the breaking changes vs 18.** Recognize a removed or changed-out-from-under-you API on sight and migrate it.
3. **Every example is version-correct.** Never paste a snippet whose React version you can't vouch for. When a change
   matters, show the 18 → 19 before/after so the reader sees _why_.

## Before you use a newer API: confirm what's installed

React features are gated by **minor**, not just major — `browser()`, `<ViewTransition>`, and Fragment refs landed in
19.3; `<Activity>` and `useEffectEvent` in 19.2. Before asserting one exists, check the installed version rather than
recalling it:

```bash
node -p "require('react/package.json').version"
```

- If the installed version is **< the minor that introduced an API**, that API is not there yet — don't emit it, say so.
- To confirm an API's real shape, read the installed `@types/react` declarations rather than guessing.

## Default to React 19, not React 18

When you're about to write the left column, write the right column instead. These are the changes that bite most often:

| If muscle memory says (React 18)              | Write this (React 19)                                            |
| --------------------------------------------- | ---------------------------------------------------------------- |
| `forwardRef((props, ref) => …)`               | `ref` is an ordinary prop on a function component                |
| `<Ctx.Provider value={…}>`                    | `<Ctx value={…}>` (Context itself is the provider)               |
| `Comp.propTypes = {…}`                        | TypeScript prop types (`interface Props`)                        |
| `Comp.defaultProps = {…}` (function comp.)    | ES default params: `function C({ x = 1 }: Props)`                |
| `ReactDOM.render` / `hydrate`                 | `createRoot(el).render(…)` / `hydrateRoot(el, …)`                |
| `useContext(Ctx)` for a value you always read | `useContext` still fine; use `use(Ctx)` when reading in a branch |
| manual `isPending` + fetch + error state      | an **Action**: `useActionState` / `<form action={fn}>`           |
| `react-helmet` / manual `<head>` juggling     | render `<title>`/`<meta>`/`<link>` in the component body         |
| a ref callback with an implicit return        | a ref callback with a **block body** (return = cleanup fn)       |

The full removals-and-migrations catalog (with before/after and codemods) is in
[references/breaking-changes-18-to-19.md](references/breaking-changes-18-to-19.md). Read it before doing any 18 → 19
migration or reviewing code that predates 19.

## The 19.0 idioms

`ref` as a prop, `<Context>` as its own provider, Actions (`useActionState`, `useFormStatus`, `useOptimistic`), `use`
for promises and context, and document metadata with resource loading. Version-correct examples of each are in
[references/whats-new-19.md](references/whats-new-19.md#190--the-major-api-shift) — load it before writing one whose
exact shape you are not certain of.

## Prioritize what 19.1 → 19.3 added

"Default to 19.3" means preferring these over the pre-19 workaround they replace. Full timeline with examples is in
[references/whats-new-19.md](references/whats-new-19.md); the headline additions:

- **19.3** — `<ViewTransition>` is now **stable** (animate enter/exit/move/resize via the browser View Transition API,
  works with `startTransition`, Suspense reveals, and `useDeferredValue`); **Fragment refs** (a `ref` on `<Fragment>`
  gives a `FragmentInstance` with `focus`, `addEventListener`, `observeUsing`, measurement…); **`browser()`** from
  `react-dom` — `use(browser())` opts a subtree out of SSR (suspends on the server, renders on the client), the correct
  way to gate browser-only APIs like `localStorage`/timezone; **Trusted Types** pass-through; Transitions now render
  independently so a slow one no longer blocks unrelated ones.
- **19.2** — `<Activity mode="hidden|visible">` (pre-render/keep-alive subtrees); **`useEffectEvent`** (extract
  non-reactive logic out of an Effect so it drops from the dependency array); `cacheSignal()` (RSC); partial
  pre-rendering `resume()` APIs; Performance Tracks in Chrome DevTools.
- **19.1** — Owner Stacks (`captureOwnerStack`, dev-only) for better component-tree diagnostics.

Before using a 19.2/19.3 API, confirm the installed version covers it (see the version check above).

## Reference files

- [references/breaking-changes-18-to-19.md](references/breaking-changes-18-to-19.md) — every removal and behavioral
  change from 18 to 19, with before/after code and the `codemod` commands. The source of truth for migrations.
- [references/whats-new-19.md](references/whats-new-19.md) — feature timeline 19.0 → 19.3 with runnable examples. The
  source of truth for "is this API current, and which minor introduced it."
