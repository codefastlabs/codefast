# Type design

The items below are what a first draft most often gets wrong while still compiling under `strict`. In Write mode, write
so none of them applies; in an audit, each is a finding — AUTO-FIX unless marked.

## Shape

- States are a discriminated union, closed value sets a literal union from one `as const` source, and primitives that
  must not mix (IDs of different entities, values in different units) branded types where a mix-up is plausible. PROPOSE
  once the reshape reaches an exported type.
- A type restating what a value, a schema, or another type already says is derived (`typeof`, `z.infer`, `Pick`, a
  mapped type), not written again.
- Annotate at boundaries and let inference type the inside; a local annotation inference would get right widens
  literals. A caller forced to spell out type arguments wants a `const` type parameter or `NoInfer`.

## Soundness

- A type guard or assertion function is trusted unconditionally, so its body must check everything its predicate claims;
  an under-checking guard is an `as` in disguise.
- A type parameter that only types a value produced from untyped data (`get<Value>(key): Value` over `JSON.parse`) is an
  unchecked cast: return `unknown`, or take a parser that produces the value. A generic factory whose returned object is
  itself generic (`createEmitter<Events>()`, `new Map<K, V>()`) is sound and stays.
- Untrusted data — `JSON.parse`, `response.json()`, storage, environment, messages, URL and form input — enters as
  `unknown` and is parsed once at the edge; the `any` those APIs return never flows onward.
- A helper that turns a caught value into a message must not throw itself: `String(value)` throws on a null-prototype
  object or one whose `toString` throws.
- Under `exactOptionalPropertyTypes`, an optional property that may receive `undefined` is typed `?: T | undefined`.

## Structural traps

- `Object.keys`/`Object.entries` yield `string` keys, and casting them to `keyof Target` is unsound — an object may
  carry keys its type does not list. Iterate a key list that is itself typed, or keep the data in a `Map`.
- Excess-property checks fire only on a fresh object literal; the same stray key passes silently through a variable.
  Where an extra key is a bug, build the object inline, or declare it with `satisfies` the type at creation.
- Method shorthand in an interface (`handle(x: Animal): void`) is bivariant even under `strictFunctionTypes`, so a
  handler of a narrower type is accepted. Declare callbacks as properties (`handle: (x: Animal) => void`).
- A generic interface whose members reach its parameter through mapped or conditional types can have its variance
  measured too loosely, so `Emitter<{ a: string | number }>` passes where `Emitter<{ a: string }>` is expected. Test
  assignability in both directions, and fix it with an `in`/`out` annotation.
- `.filter(Boolean)` does not narrow; a predicate such as `.filter((x) => x !== undefined)` does. It also drops `""`,
  `0` and `false`, so a replacement must keep dropping whatever the original dropped.
