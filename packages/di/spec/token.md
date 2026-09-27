# Token API

## Creating a token

`token()` is a factory function — consistent with how modern TypeScript reads (much like `signal()`, `ref()`).

```ts
import { token } from "@codefast/di";

// Basic
const Logger = token<LoggerService>("app:Logger");
const Database = token<DatabaseService>("app:Database");
const Config = token<AppConfig>("app:Config");

// Token for a primitive
const Port = token<number>("app:Port");
const Env = token<"development" | "production">("app:Env");

// Organised by domain
export const Tokens = {
  Logger: token<LoggerService>("app:Logger"),
  Database: token<DatabaseService>("app:Database"),
  Config: token<AppConfig>("app:Config"),
} as const;
```

## Display names

The string a `token()`, `tag()` or module factory takes is its **display name**: what diagnostics print, what
`ResolutionFrame.tokenName` carries, and what the `when*Is` / `when*Named` constraints compare. It is not the thing's
identity — the object is — so two declarations may share one, and nothing but this rule stops them.

> **Normative — a display name is spelled like the TS symbol it stands for, under its owner's namespace:
> `<namespace>:<Name>`.**
>
> | Kind    | Stands for                        | Name half  | Example                            |
> | ------- | --------------------------------- | ---------- | ---------------------------------- |
> | token   | a type or class                   | PascalCase | `shop:Logger`, `di:MetadataReader` |
> | module  | a unit of composition             | PascalCase | `shop:Infra`, `app:Root`           |
> | tag key | an attribute a request selects on | camelCase  | `shop:cacheTier`, `di:name`        |
>
> The namespace is the owner — the kebab-case slug of the package, app or feature that declares the name, or a scoped
> package name (`@scope/pkg:Config`) — and the library's own names sit under `di:`. Slot names (`whenNamed("primary")`)
> and tag values (`Region.of("eu")`) are **values**, not display names: they mean something only within one token or one
> key, so they stay lowercase and take no prefix. The convention holds in the library, the docs and every example, and
> `pnpm cli:audit:display-names` fails the build where it does not; tests and benchmarks are outside it, since a name
> there is scoped by its file and meets no other author's.

What it buys: a diagnostic that says `No binding for 'shop:Logger'` names one owner; two features that each declare a
`Clock` cannot produce a `whenParentIs` false match; a reader tells a token from a tag key from a module by its shape;
and a doc sample carries the shape a real app needs.

## Type signature

```ts
// Branded type — cannot be forged with an ordinary object literal
declare const TOKEN_BRAND: unique symbol;
declare const TOKEN_NAMES_BRAND: unique symbol;

interface Token<Value, Names extends string = string> {
  readonly name: string;
  readonly [TOKEN_BRAND]: Value; // unique symbol, not exported
  readonly [TOKEN_NAMES_BRAND]?: Names; // phantom: the slot names this token's bindings may declare
}
```

```ts
// Declaring the slot names makes every `name` the token meets a checked, completable literal
const Logger = token<Logger, "console" | "file">("app:Logger");
container.bind(Logger).whenNamed("file").to(FileLogger);
container.resolve(Logger, { name: "file" }); // { name: "fiel" } is a compile error
type Names = SlotNamesOf<typeof Logger>; // "console" | "file"; `string` for a class or an undeclared token
```

`Names` is covariant and defaults to `string`, so a token declaring none behaves as before, and a declaring token is
still a `Token<unknown>` wherever the engine erases the value type. Only the token infers `Names`: the `options` bag of
`resolve*`, `has`, `hasOwn`, `inject`, `optional` and `injectAll` is `NoInfer`, so a request cannot widen the set.

```ts
// Resolve always returns the right type — the wrong token cannot be passed
const logger = container.resolve(Logger); // ^? LoggerService
const port = container.resolve(Port); // ^? number
```

## A class as a token

A class can be used directly as a token when no abstraction is needed:

```ts
// No separate token needed — the class is the token
container.bind(ConsoleLogger).toSelf();
const logger = container.resolve(ConsoleLogger); // ^? ConsoleLogger

// When injecting through an interface → use a Token
container.bind(Logger).to(ConsoleLogger);
const logger = container.resolve(Logger); // ^? LoggerService
```

> **`toSelf()` without `@injectable()`.** If `ConsoleLogger` has no `@injectable()` and its constructor declares
> parameters, the container throws `MissingMetadataError` — it does not assume zero deps. "Declares parameters" is the
> class's `length`, the count of parameters before the first one with a default or a rest: a constructor of `(...deps)`
> or `(a = x)` has a `length` of 0, so it is built with no arguments and nothing throws. To use `toSelf()` with
> constructor deps but no decorator, use `toDynamic()` or `toResolved()` instead.
