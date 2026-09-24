# What's new across React 19.0 → 19.3

The feature timeline, so "prioritize 19.3" is concrete: which minor introduced each API, and a version-correct example
for each. Confirm the installed version covers a minor before emitting its APIs
(`node -p "require('react/package.json').version"`). All examples use named imports.

## Table of contents

- [19.0 — the major API shift](#190--the-major-api-shift)
  - [`ref` as a prop](#ref-as-a-prop--no-forwardref), [`<Context>` as provider](#context-is-its-own-provider),
    [Actions](#actions-useactionstate-useformstatus-useoptimistic), [`use`](#use-for-promises),
    [metadata](#document-metadata--resource-loading)
- [19.1 — Owner Stacks](#191--owner-stacks)
- [19.2 — Activity, Effect Events, resume](#192--activity-effect-events-resume)
- [19.3 — View Transitions, Fragment refs, browser()](#193--view-transitions-fragment-refs-browser)

## 19.0 — the major API shift

The idioms that replaced React 18 patterns: a summary, then an example of each.

- **Actions** — async functions in `<form action>` / `startTransition`; `useActionState`, `useFormStatus`,
  `useOptimistic` track pending/error/optimistic state.
- **`use`** — read a promise or context during render; may be called conditionally.
- **`ref` as a prop** — no more `forwardRef`; ref callbacks may return a cleanup.
- **`<Context>` as provider** — `<Ctx value>` instead of `<Ctx.Provider value>`.
- **Document metadata** — render `<title>`/`<meta>`/`<link>`, hoisted to `<head>`.
- **Stylesheets & async scripts** — `<link rel="stylesheet" precedence>`, dedup'd `<script async>`.
- **Resource preloading** — `preload`, `preinit`, `preconnect`, `prefetchDNS` from `react-dom`.
- **Root error options** — `onCaughtError`, `onUncaughtError`, `onRecoverableError`.
- **Static SSG** — `prerender` / `prerenderToNodeStream` from `react-dom/static`.
- **Custom elements** — full property/attribute support.

### `ref` as a prop — no `forwardRef`

A function component receives `ref` in its props like any other prop. `forwardRef` still works but is on its way out;
don't reach for it in new code.

```tsx
import type { ComponentProps, Ref } from "react";

interface TextInputProps extends ComponentProps<"input"> {
  ref?: Ref<HTMLInputElement>;
}

function TextInput({ ref, ...props }: TextInputProps) {
  return <input ref={ref} {...props} />;
}
```

Ref callbacks may return a **cleanup** function; an implicit return is now a type error, so use a block body:

```tsx
<div
  ref={(node) => {
    // setup
    return () => {
      // cleanup
    };
  }}
/>
```

### `<Context>` is its own provider

```tsx
import type { ReactNode } from "react";

import { createContext, use } from "react";

const ColorSchemeContext = createContext<"light" | "dark">("light");

interface AppProps {
  children: ReactNode;
}

function App({ children }: AppProps) {
  return <ColorSchemeContext value="dark">{children}</ColorSchemeContext>;
}

interface HeadingProps {
  children: ReactNode;
}

// `use` can read context inside a conditional — `useContext` cannot.
function Heading({ children }: HeadingProps) {
  const colorScheme = use(ColorSchemeContext);
  return <h1 className={colorScheme === "dark" ? "text-white" : "text-black"}>{children}</h1>;
}
```

### Actions: `useActionState`, `useFormStatus`, `useOptimistic`

An async function passed to `<form action>` (or run via `startTransition`) is an **Action**; React tracks its pending
state, errors, and optimistic updates for you. Reach for this instead of hand-rolling `isPending`/`error` state.

```tsx
import { useActionState, useOptimistic } from "react";
import { useFormStatus } from "react-dom";

interface ProfileFormProps {
  currentName: string;
}

function ProfileForm({ currentName }: ProfileFormProps) {
  const [optimisticName, setOptimisticName] = useOptimistic(currentName);

  // useActionState returns [state, dispatchAction, isPending].
  const [error, submitAction, isPending] = useActionState(async (_prev: string | null, formData: FormData) => {
    const next = String(formData.get("name"));
    setOptimisticName(next);
    return (await updateName(next)) ?? null; // return the error, or null on success
  }, null);

  return (
    <form action={submitAction}>
      <p>{optimisticName}</p>
      <input name="name" disabled={isPending} />
      {error ? <p role="alert">{error}</p> : null}
      <SubmitButton />
    </form>
  );
}

// useFormStatus reads the enclosing <form>'s pending state — no prop drilling.
function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>Save</button>;
}
```

### `use` for promises

`use` unwraps a promise during render and integrates with Suspense. Unlike a hook, it may be called conditionally.

```tsx
import { use, Suspense } from "react";

interface CommentsProps {
  commentsPromise: Promise<string[]>;
}

function Comments({ commentsPromise }: CommentsProps) {
  const comments = use(commentsPromise); // suspends until resolved
  return comments.map((c, i) => <p key={i}>{c}</p>);
}

function Page({ commentsPromise }: CommentsProps) {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <Comments commentsPromise={commentsPromise} />
    </Suspense>
  );
}
```

### Document metadata & resource loading

Render `<title>`/`<meta>`/`<link>` anywhere; React hoists them to `<head>`. Stylesheets take a `precedence`. Preload
from `react-dom`.

```tsx
import { preinit, preload } from "react-dom";

interface ArticleProps {
  title: string;
}

function Article({ title }: ArticleProps) {
  preload("https://example.com/font.woff2", { as: "font" });
  preinit("https://example.com/analytics.js", { as: "script" });
  return (
    <article>
      <title>{title}</title>
      <meta name="description" content={title} />
      <link rel="stylesheet" href="/article.css" precedence="default" />
      <h1>{title}</h1>
    </article>
  );
}
```

## 19.1 — Owner Stacks

Dev-only diagnostics. `captureOwnerStack()` returns the current owner-component stack (which components rendered this
one), improving error and warning messages. Development builds only — returns `null` in production. No app-code change
required to benefit; call it in custom error tooling if you need the stack string.

## 19.2 — Activity, Effect Events, resume

### `<Activity>` — prioritized / kept-alive subtrees

```tsx
import type { ReactNode } from "react";

import { Activity } from "react";

interface RouterProps {
  isVisible: boolean;
  children: ReactNode;
}

function Router({ isVisible, children }: RouterProps) {
  // "hidden": children hidden, effects unmounted, updates deferred until idle — state is preserved.
  return <Activity mode={isVisible ? "visible" : "hidden"}>{children}</Activity>;
}
```

Use it to pre-render a hidden page or keep a tab's state while it's off-screen — replaces manual mount/unmount juggling.

### `useEffectEvent` — non-reactive logic out of an Effect

Extract the part of an Effect that reads the latest props/state but shouldn't _trigger_ the Effect, so it drops out of
the dependency array.

```tsx
import { useEffect, useEffectEvent } from "react";

interface ChatRoomProps {
  roomId: string;
  colorScheme: string;
}

function ChatRoom({ roomId, colorScheme }: ChatRoomProps) {
  const onConnected = useEffectEvent(() => {
    showNotification("Connected!", colorScheme); // always sees the latest color scheme…
  });

  useEffect(() => {
    const connection = createConnection(roomId);
    connection.on("connected", onConnected);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]); // …yet colorScheme is NOT a dependency, so changing it won't reconnect
}
```

Never list an Effect Event in a dependency array, and don't call it during render.

### `cacheSignal()` — RSC only

Signals when a `cache()` lifetime ends, so you can abort in-flight work:

```tsx
import { cache, cacheSignal } from "react";

const dedupedFetch = cache(fetch);
async function Component() {
  await dedupedFetch(url, { signal: cacheSignal() });
}
```

### Partial pre-rendering (resume APIs)

Pre-render static shell, resume the rest later.

- `react-dom/server`: `resume()`, `resumeToPipeableStream()`
- `react-dom/static`: `resumeAndPrerender()`, `resumeAndPrerenderToNodeStream()`
- `prerender` now returns `{ prelude, postponed }`; feed `postponed` to `resume`.

### Other 19.2 notes

- Performance Tracks (Scheduler + Components) in Chrome DevTools.
- Suspense reveals batch briefly during SSR streaming.
- Web Streams (`renderToReadableStream`, `prerender`) available on Node.js — but Node Streams APIs still perform better.
- `eslint-plugin-react-hooks` v6: flat config in `recommended` (use `recommended-legacy` for the old format).
- `useId` default prefix changed `:r:` → `_r_`.

## 19.3 — View Transitions, Fragment refs, browser()

Prefer these over the older workarounds they replace.

### `<ViewTransition>` — now stable

Animate elements as they enter, exit, move, or resize, driven by the browser's View Transition API. Activates when the
change is inside `startTransition`, a Suspense reveal, or `useDeferredValue`.

```tsx
import type { ReactNode } from "react";

import { ViewTransition, startTransition, addTransitionType } from "react";

interface GalleryProps {
  showing: boolean;
  children: ReactNode;
}

function Gallery({ showing, children }: GalleryProps) {
  return showing ? <ViewTransition>{children}</ViewTransition> : null;
}

// Direction-aware animations via transition types:
function next(setSlide: (fn: (c: number) => number) => void) {
  startTransition(() => {
    addTransitionType("next");
    setSlide((c) => c + 1);
  });
}

// <ViewTransition enter={{ next: "from-right" }} exit={{ next: "to-left" }}>…</ViewTransition>
```

Animation kinds: **enter / exit / update / share**. Customize with View Transition CSS classes or the Web Animations
API; event props `onEnter`/`onExit`/`onShare`/`onUpdate`. Also wraps `<Suspense>` to animate reveals
(`<ViewTransition update="auto" default="none">`). DOM only for now.

### Fragment refs

A `ref` on `<Fragment>` yields a `FragmentInstance` covering all the fragment's children, regardless of their internal
structure.

```tsx
import { Fragment, useEffect, useRef } from "react";

interface ListItem {
  id: string;
  label: string;
}

interface ListProps {
  items: readonly ListItem[];
}

function List({ items }: ListProps) {
  const fragmentRef = useRef<FragmentInstance>(null);

  useEffect(() => {
    fragmentRef.current?.observeUsing(intersectionObserver);
    return () => fragmentRef.current?.unobserveUsing(intersectionObserver);
  }, []);

  return (
    <Fragment ref={fragmentRef}>
      {items.map((it) => (
        <li key={it.id}>{it.label}</li>
      ))}
    </Fragment>
  );
}
```

`FragmentInstance` offers: event handling (`addEventListener`/`removeEventListener`/`dispatchEvent`), focus
(`focus`/`focusLast`/`blur`), observers (`observeUsing`/`unobserveUsing` for Intersection/Resize observers), and
measurement (`getClientRects`/`getRootNode`/`compareDocumentPosition`/`scrollIntoView`).

### `browser()` — opt a subtree out of SSR

`use(browser())` suspends on the server (rendering the Suspense fallback into the HTML) but resolves on the client — the
sanctioned way to gate browser-only APIs (`localStorage`, timezone, `window`) instead of `useEffect` + mismatch hacks.

```tsx
import { use, Suspense } from "react";
import { browser } from "react-dom";

function TimeZone() {
  use(browser()); // server: suspend; client: continue
  return <p>{new Intl.DateTimeFormat().resolvedOptions().timeZone}</p>;
}

export function App() {
  return (
    <Suspense fallback="Loading…">
      <TimeZone />
    </Suspense>
  );
}
```

> `use(browser())` fits deployments that cache and share SSR/SSG HTML across visitors (a CDN or ISR shell): per-visitor
> values must not be baked into a build-time render, and this resolves them on the client instead. Pair it with your
> data layer's client fetch wherever the value is per-request.

### Other 19.3 features

- **Trusted Types** — React passes `TrustedHTML`/`TrustedScript`/`TrustedScriptURL` through without coercion, so a
  `Content-Security-Policy: require-trusted-types-for 'script'` can validate them.
- **Direct Context rendering in Server Components** — a Server Component can render `<Ctx value={…}>` directly (the
  Context is defined in a `"use client"` module) without a wrapper Provider component.
- **Transitions render independently** — a slow Transition no longer holds up unrelated ones.
- Assorted DOM support: `onFullscreenChange`/`onFullscreenError`, SVG `maskType`, `fetchPriority` for modules,
  `credentialless` iframes, `submitter` in submit events. No breaking changes or deprecations in 19.3 — it's additive.
