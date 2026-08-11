---
"@codefast/di": minor
---

What a constructor and a factory are handed is now checked against what they declare.

`@injectable([...])` had no relation to the class it decorated. Deps in the wrong order compiled and injected the wrong
dependency; a deps array one short compiled and handed a parameter `undefined`; `injectAll()` handed an array to a
parameter declaring one value, and `optional()` handed `undefined` to one that did not admit it. Every case failed
silently — resolution succeeded, the object was built, and the wrong value was already inside it.

The decorator now infers its deps and requires the class to match:

```ts
@injectable([ConfigToken, LoggerToken]) // Property 'log' is missing in type 'Config'
class Service {
  constructor(
    readonly logger: Logger,
    readonly config: Config,
  ) {}
}
```

`@injectable()` and `@injectable([])` are unchanged — a separate overload keeps the no-dependency form as loose as it
was, for classes that inject through properties.

One mismatch still compiles: a deps array **longer** than the constructor, because a class taking fewer parameters
satisfies a constructor type taking more. The surplus dependency is resolved and discarded rather than misplaced, which
makes it the least harmful of the four.

Alongside it, a hand-written `InjectionDescriptor` no longer lies to a `toResolved` factory.
`{ token: Plugin, multi: true }` said `Plugin` and delivered `Array<Plugin>`; `optional: true` said `Plugin` and could
deliver `undefined`. `ResolvedDependencyValue` reads the flags before the descriptor's own type parameter, so both now
say what they do. `injectAll()` and `optional()` were already correct and are untouched.

The tightening found real looseness in `examples/17-extended-constraints` immediately: thirteen tokens were declared by
structural shape — `token<{ score(): string }>` — while the constructors receiving them declared the concrete class,
which has private members and is therefore a different type. Every one of those tokens is bound to exactly that class,
so they now say so.
