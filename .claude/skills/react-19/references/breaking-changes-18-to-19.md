# Breaking changes: React 18 → 19

Every removal and behavioral change that turns working React 18 code into broken or wrong React 19 code. Read this
before any 18 → 19 migration or when reviewing code that predates 19. Source: the official React 19 upgrade guide.

Run everything at once with the migration recipe, then fix what the codemods can't:

```bash
npx codemod@latest react/19/migration-recipe # all JS/TS codemods
npx types-react-codemod@latest preset-19 ./path-to-app # TypeScript type migrations
```

## Table of contents

- [Removed rendering APIs](#removed-rendering-apis)
- [Removed component patterns](#removed-component-patterns)
- [Removed test utilities](#removed-test-utilities)
- [Ref changes](#ref-changes)
- [Error-handling changes](#error-handling-changes)
- [JSX transform requirement](#jsx-transform-requirement)
- [TypeScript breaking changes](#typescript-breaking-changes)
- [Smaller removals](#smaller-removals)

## Removed rendering APIs

These moved to `react-dom/client` in React 18 and are **removed** in 19.

```js
// ❌ React 18
import { render, hydrate, unmountComponentAtNode } from "react-dom";
render(<App />, container);
hydrate(<App />, container);
unmountComponentAtNode(container);

// ✅ React 19
import { createRoot, hydrateRoot } from "react-dom/client";
const root = createRoot(container);
root.render(<App />);
hydrateRoot(container, <App />); // note: (container, element) — arg order flips vs hydrate
root.unmount();
```

Codemod: `npx codemod@latest react/19/replace-reactdom-render`

**`findDOMNode` is removed** — use a ref:

```js
// ❌ import { findDOMNode } from "react-dom"; const node = findDOMNode(this);
// ✅
const ref = useRef(null);
// …attach ref to the element, then read ref.current
```

## Removed component patterns

**String refs** → ref callbacks. Codemod: `react/19/replace-string-ref`.

```js
// ❌  <input ref="input" />  … this.refs.input
// ✅  <input ref={(el) => { this.input = el; }} />  … this.input
```

**`propTypes` and `defaultProps` (function components)** → TypeScript + ES default params. `defaultProps` still works
for _class_ components. Codemod: `react/prop-types-typescript`.

```tsx
// ❌
function Heading({ text }) {
  return <h1>{text}</h1>;
}
Heading.propTypes = { text: PropTypes.string };
Heading.defaultProps = { text: "Hello" };

// ✅
interface HeadingProps {
  text?: string;
}
function Heading({ text = "Hello" }: HeadingProps) {
  return <h1>{text}</h1>;
}
```

**Legacy Context** (`contextTypes` / `getChildContext`) → `createContext`.

```js
// ❌ static childContextTypes / getChildContext() / static contextTypes
// ✅
const FooContext = createContext();
// Parent: <FooContext value="bar"><Child /></FooContext>
// Child (class): static contextType = FooContext;  this.context
```

**Module-pattern factory components** → plain function components.

```js
// ❌ function C() { return { render() { return <div />; } }; }
// ✅ function C() { return <div />; }
```

**`React.createFactory`** → JSX. `const button = createFactory("button")` → `const button = <button />`.

## Removed test utilities

```diff
- import { act } from "react-dom/test-utils";
+ import { act } from "react";
```

Codemod: `react/19/replace-act-import`.

- `react-test-renderer/shallow` is removed → `npm i -D react-shallow-renderer` and import from there.
- `react-test-renderer` is deprecated → migrate to `@testing-library/react`.

## Ref changes

- **`ref` is a prop** on function components — new code should not use `forwardRef` (it still works but is being phased
  out). See the SKILL.md example.
- **Accessing `element.ref` warns** — use `element.props.ref`.
- **Ref callbacks may return a cleanup function.** Consequently a callback that _implicitly returns_ a value is now a
  type error. Use a block body:

```diff
- <div ref={(current) => (instance = current)} />
+ <div ref={(current) => { instance = current; }} />
```

## Error-handling changes

**Errors thrown during render are no longer re-thrown to the console the old way.** They're routed to callbacks you set
on the root, so wire these up to keep visibility:

```js
const root = createRoot(container, {
  onUncaughtError: (error, errorInfo) => {}, // not caught by any Error Boundary → also window.reportError
  onCaughtError: (error, errorInfo) => {}, // caught by an Error Boundary → also console.error
  onRecoverableError: (error, errorInfo) => {}, // auto-recovered (e.g. hydration mismatch)
});
```

`errorInfo.digest` was removed from `onRecoverableError`.

## JSX transform requirement

The **modern JSX transform is now required.** Without it you'll see a console warning ("outdated JSX transform") and
features like `ref` as a prop won't work. Ensure the toolchain uses `jsx: "react-jsx"` (or the automatic runtime).

## TypeScript breaking changes

Run `npx types-react-codemod@latest preset-19 ./path` first, then handle these by hand:

- **`useRef` requires an argument.** `useRef()` → `useRef(undefined)` (or `useRef<T>(null)`).
- **`ReactElement["props"]` defaults to `unknown`** (was `any`). Narrow before use.
- **`useReducer` inference changed** — don't pass the old single type argument:

  ```diff
  - useReducer<React.Reducer<State, Action>>(reducer)
  + useReducer(reducer)                       // let inference work, or:
  + useReducer<State, [Action]>(reducer)      // state + action-tuple form
  ```

- **JSX namespace is module-scoped.** Global `JSX.IntrinsicElements` augmentation moves inside `declare module "react"`:

  ```ts
  declare module "react" {
    namespace JSX {
      interface IntrinsicElements {
        "my-element": { myElementProps: string };
      }
    }
  }
  ```

## Smaller removals

- JavaScript URLs in `src`/`href` (e.g. `href="javascript:…"`) now error.
- Removed: `unstable_flushControlled`, `unstable_createEventHandle`, `unstable_renderSubtreeIntoContainer`,
  `unstable_runWithPriority`.
