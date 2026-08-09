---
"@codefast/di": minor
---

`@postConstruct` and `@preDestroy` now run for an instance a factory built, not only one `.to(Class)` constructed.

The decorators sit on the class, so the same class behaved differently depending on how it was bound:

```ts
container.bind(Pool).to(Connection); // start() ran
container.bind(Pool).toDynamic(() => new Connection()); // start() did not
```

`lifecycleMethods()` read the methods off `binding.target`, which only a `class` binding has. That is true of the _binding_ — but the _instance_ is a class either way, and it is the instance the hooks belong to. A factory names no class up front, so the class is now read off the value it returned, and re-read whenever a factory returns a different one.

`toConstantValue` is deliberately excluded: the caller built that instance, not the container. `toAlias` too, since the binding it points at has already run them.

### Throughput is unchanged

The resolver reaches an instance through several specialised lanes that each hand the value back without a pipeline — transient dynamic sync, its async and cascade twins, the compiled instantiation plan, and the general path. Fixing the general path alone passed 6 of the 14 lanes; making every factory binding decline its fast lane passed all of them and cost roughly 4× on async fan-out, so neither shipped.

What ships keeps every fast lane and checks what it produced. The class is read off the instance and memoized on the binding, so a factory returning the same class pays one identity comparison rather than a metadata lookup, and a process that declares no lifecycle method anywhere pays a single boolean.

Paired A/B against `main`, 8 alternating isolated runs in both orders, 65 scenarios: **geomean 0.9940×, median 0.9967×, 64 of 65 rows within ±5%**. The same build compared against itself over the same runs gives 0.9929×–0.9952×, so the measured difference sits inside the method's own noise — there is no detectable cost.
