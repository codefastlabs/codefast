# Advanced Constraints

**Mental model.** These helpers are convenience factories for `when()` predicates. Each takes a token, a name, or a
criterion and returns `(ctx: ConstraintContext) => boolean`. Nothing here adds a mechanism: everything an advanced
constraint does, a hand-written `when()` over `ctx.parent` and `ctx.ancestors` could do too.

Where `whenNamed` / `whenTagged` filter statically by slot (O(1)), advanced constraints inspect **where the binding sits
in the dependency graph at runtime**: which token is the direct parent, which slot of an ancestor is active. The typical
use case is injecting differently depending on the subtree being resolved — for example, `VerboseLogger` when an
ancestor is `DebugModule`, or `SandboxMailer` when some ancestor carries the tag `env=test`.

Advanced constraints are exported from the root `@codefast/di`, and also from the dedicated subpath
`@codefast/di/resolution/select/constraints`, which points at the same module. The examples in this section import from
the root — the shorter path, and always correct.

## Token name resolution

> **Normative.** Every constraint function takes a `Token<unknown> | Constructor` and resolves it to a `tokenName`
> string, which is compared against `ResolutionFrame.tokenName`:
>
> - `Token<Value>` → use `token.name` (the string given at `token("app:Logger")`)
> - `Constructor` → use `Constructor.name` (the JavaScript class name)

> **Unique names.** `ResolutionFrame.tokenName` is a `string`, not a branded type. If two different tokens share a
> `name` — say `token<A>("app:Config")` and `token<B>("app:Config")` — a constraint cannot tell them apart. This is why
> a display name is `<namespace>:<Name>` ([Display names](token.md#display-names)): two owners never mint the same name
> by accident, so a false match can only come from one owner naming two tokens alike.

## Type signatures

Ten constraints, each taking configuration parameters and returning a predicate over `ConstraintContext`:

| Constraint                          | Matches when                                                     | With no parent / ancestor |
| ----------------------------------- | ---------------------------------------------------------------- | :-----------------------: |
| `whenParentIs(token)`               | the direct parent is that token                                  |          `false`          |
| `whenNoParentIs(token)`             | the direct parent is **not** that token                          |          `true`           |
| `whenParentNamed(token, name)`      | the direct parent is that token and its slot carries that name   |          `false`          |
| `whenParentTagged(criterion)`       | the parent's slot contains that criterion                        |          `false`          |
| `whenParentTaggedAll(tags)`         | the parent's slot contains **all** the given criteria            |          `false`          |
| `whenAnyAncestorIs(token)`          | at least one ancestor is that token                              |          `false`          |
| `whenNoAncestorIs(token)`           | **no** ancestor is that token                                    |          `true`           |
| `whenAnyAncestorNamed(token, name)` | some ancestor is that token and its slot carries that name       |          `false`          |
| `whenAnyAncestorTagged(criterion)`  | some ancestor carries that criterion                             |          `false`          |
| `whenAnyAncestorTaggedAll(tags)`    | **at least one** ancestor's slot contains **all** given criteria |          `false`          |

The two negative forms returning `true` on absence are deliberate: "no parent is X" is trivially true when there is no
parent at all. The two `…TaggedAll` forms are equivalent to AND-composing several individual criteria, but cost one
predicate call and allocate no intermediate closure. Criteria compare by identity — equivalent to `Object.is` on
`[key, value]` thanks to interning, consistent with slot equality in
[Slots and last-wins](binding.md#slots-and-last-wins--the-exact-definition).

> **Normative — an empty criterion list is rejected.** `whenParentTaggedAll([])` reads literally as "the parent carries
> all of nothing", which is true of every parent — the constraint would silently weaken into "there is some parent",
> while still winning specificity over an unconstrained binding. Both `…TaggedAll` variants throw
> `EmptyTagCriteriaError` right at the call site.

> **Normative — a slot name nobody declares.** A slot name is a bare string, so a name the token does not type — a token
> declaring no `Names`, or the reserved criterion `slotName.of(n)` handed to a `…Tagged` helper — can be a typo that
> produces a constraint that is never true and that nobody reports. `validate()` throws `UnreachableConstraintError`
> when the name is not declared where the constraint waits for it: for `whenParentNamed(T, n)` /
> `whenAnyAncestorNamed(T, n)`, on a binding **of `T`** in the container chain; for a reserved criterion in
> `whenParentTagged`, `whenAnyAncestorTagged` or either `…TaggedAll`, on a binding of any token. A criterion of any
> other key records nothing — it is minted from a typed key, so it cannot be a typo. The requirement survives `when()`
> chaining: a composed predicate carries both sides' requirements, so narrowing a helper-built constraint does not hide
> it from `validate()`.

> **Exact shape:** `src/resolution/select/constraints.ts`.

## Semantics

`ctx.parent` is the `ResolutionFrame` of the binding directly above in the stack (the binding currently injecting this
token). `ctx.ancestors` is every frame above `ctx.parent`, ordered from the root down to the grandparent — it does not
include `ctx.parent`.

> **Normative — the canonical implementation table.**
>
> | Function                            | Logic                                                                                                      |
> | ----------------------------------- | ---------------------------------------------------------------------------------------------------------- |
> | `whenParentIs(token)`               | `ctx.parent !== undefined && ctx.parent.tokenName === tokenNameOf(token)`                                  |
> | `whenNoParentIs(token)`             | `ctx.parent === undefined \|\| ctx.parent.tokenName !== tokenNameOf(token)`                                |
> | `whenAnyAncestorIs(token)`          | `ctx.ancestors.some(f => f.tokenName === tokenNameOf(token))`                                              |
> | `whenNoAncestorIs(token)`           | `ctx.ancestors.every(f => f.tokenName !== tokenNameOf(token))`                                             |
> | `whenParentNamed(token, name)`      | `ctx.parent !== undefined && ctx.parent.tokenName === tokenNameOf(token) && ctx.parent.slot.name === name` |
> | `whenAnyAncestorNamed(token, name)` | `ctx.ancestors.some(f => f.tokenName === tokenNameOf(token) && f.slot.name === name)`                      |
> | `whenParentTagged(criterion)`       | `ctx.parent !== undefined && ctx.parent.slot.tags.includes(criterion)`                                     |
> | `whenAnyAncestorTagged(criterion)`  | `ctx.ancestors.some(f => f.slot.tags.includes(criterion))`                                                 |
> | `whenParentTaggedAll(tags)`         | `ctx.parent !== undefined && tags.every(t => ctx.parent.slot.tags.includes(t))`                            |
> | `whenAnyAncestorTaggedAll(tags)`    | `ctx.ancestors.some(f => tags.every(t => f.slot.tags.includes(t)))`                                        |

> **The named variants read `slot.name`, not `currentResolveOptions`.** `whenParentNamed(Logger, "console")` asks "is
> the parent a `Logger` binding declaring `whenNamed("console")`?" — not "was the parent resolved with the hint
> `{ name: "console" }`?". Those are different questions: a hint-less `resolveAll(Logger)` builds the `"console"`
> binding with no hint naming it, and a hint can reach a binding whose slot records no name — through a default-slot
> alias that forwards it, say.

> **Why identity comparison is enough.** Criteria are interned, so each `[key, value]` has exactly one object; comparing
> by identity therefore gives the same answer as `Object.is` on the value — handling `NaN` correctly and keeping `+0`
> distinct from `-0`, consistent with slot equality in
> [Slots and last-wins](binding.md#slots-and-last-wins--the-exact-definition). This is also why the table above has no
> pairwise comparison loop.

## Examples

**`whenParentIs` — a verbose logger only when the parent is `DebugService`:**

```ts
import { whenParentIs } from "@codefast/di";

container.bind(Logger).to(ConsoleLogger);
container.bind(Logger).when(whenParentIs(DebugService)).to(VerboseLogger);
```

When `DebugService` asks for `Logger`, the predicate matches and `VerboseLogger` is chosen. Every other service gets
`ConsoleLogger` (the default slot).

> **Make them mutually exclusive.** Both bindings above use predicate-only `when()`. If both predicates are `true`
> during one resolve, the resolver throws `AmbiguousBindingError`. Make the predicates exclude each other — for
> instance, add `.when((ctx) => !whenParentIs(DebugService)(ctx))` to the first binding as the negation.

**`whenAnyAncestorIs` — inject a different config across the whole `TestHarness` subtree:**

```ts
import type { ConstraintContext } from "@codefast/di";
import { whenAnyAncestorIs, whenParentIs } from "@codefast/di";

// `ancestors` excludes the parent, so the harness's own direct dependencies need `whenParentIs` beside it.
const underHarness = (ctx: ConstraintContext): boolean =>
  whenParentIs(TestHarness)(ctx) || whenAnyAncestorIs(TestHarness)(ctx);

container
  .bind(Config)
  .when((ctx) => !underHarness(ctx))
  .toConstantValue(prodConfig);
container.bind(Config).when(underHarness).toConstantValue(testConfig);
```

Any service resolved within the subtree rooted at `TestHarness` — `TestHarness`'s own `Config` included — receives
`testConfig`. Services outside the subtree receive `prodConfig`. `whenAnyAncestorIs(TestHarness)` alone would miss the
harness's direct dependencies, and `whenNoAncestorIs(TestHarness)` would hand them `prodConfig`.

**`whenParentNamed` — a logger that knows which slot of `Database` it serves:**

```ts
import { token, whenParentNamed } from "@codefast/di";

const Database = token<Database, "primary" | "replica">("app:Database");

container.bind(Database).whenNamed("primary").to(PrimaryDatabase).singleton();
container.bind(Database).whenNamed("replica").to(ReplicaDatabase).singleton();

container.bind(Logger).when(whenParentNamed(Database, "primary")).to(PrimaryLogger);

container.bind(Logger).when(whenParentNamed(Database, "replica")).to(ReplicaLogger);
```

When `PrimaryDatabase` is resolved (binding slot `"primary"`), it injects `PrimaryLogger` because the parent frame is a
`Database` binding whose `slot.name` is `"primary"`. The token types the name, so `"primry"` is a compile error.

**`whenAnyAncestorTagged` — pick different infrastructure by environment tag:**

```ts
import { tag, whenAnyAncestorTagged } from "@codefast/di";

const Env = tag<"test" | "prod">("app:env");

// Some ancestor in the chain carries env=test → use the sandbox
container
  .bind(Mailer)
  .when(whenAnyAncestorTagged(Env.of("test")))
  .to(SandboxMailer);

// No ancestor carries env=test → use real SMTP
container
  .bind(Mailer)
  .when((ctx) => !whenAnyAncestorTagged(Env.of("test"))(ctx))
  .to(SmtpMailer);
```

**`whenParentTaggedAll` — inject differently when the parent carries several tags at once:**

```ts
import { tag, whenParentTaggedAll } from "@codefast/di";

const Env = tag<"test" | "prod">("app:env");
const Tier = tag<"basic" | "premium">("app:tier");

// PremiumPlugin is only injected when the parent has BOTH env=prod AND tier=premium
container
  .bind(Plugin)
  .when(whenParentTaggedAll([Env.of("prod"), Tier.of("premium")]))
  .to(PremiumPlugin);

// The default fallback for every other case
container.bind(Plugin).to(BasicPlugin);
```

Equivalent to writing it by hand, but without the intermediate closure:

```ts
// Avoid — each resolve calls two separate predicates, each doing its own lookup
.when((ctx) => whenParentTagged(Env.of("prod"))(ctx) && whenParentTagged(Tier.of("premium"))(ctx))

// Use — one predicate call, one walk over the parent frame's `slot.tags`
.when(whenParentTaggedAll([Env.of("prod"), Tier.of("premium")]))
```

## Composability

The constraint functions return `(ctx: ConstraintContext) => boolean`, so they compose naturally with JavaScript
operators:

```ts
import { whenAnyAncestorIs, whenParentIs } from "@codefast/di";

// AND — both conditions must hold
container
  .bind(Logger)
  .when((ctx) => whenParentIs(AuditService)(ctx) && whenAnyAncestorIs(ProductionModule)(ctx))
  .to(AuditVerboseLogger);

// OR — either one is enough
container
  .bind(Logger)
  .when((ctx) => whenParentIs(OrderService)(ctx) || whenParentIs(PaymentService)(ctx))
  .to(OperationsLogger);
```

**Closure reuse — create once, use many times:**

```ts
// Good — the closure is created once
const isInsideDebugModule = whenAnyAncestorIs(DebugModule);

container.bind(Logger).when(isInsideDebugModule).to(VerboseLogger);
container.bind(Tracer).when(isInsideDebugModule).to(VerboseTracer);

// Avoid — a new closure each time (not wrong, just a needless allocation)
container.bind(Logger).when(whenAnyAncestorIs(DebugModule)).to(VerboseLogger);
container.bind(Tracer).when(whenAnyAncestorIs(DebugModule)).to(VerboseTracer);
```

## Rules (normative)

The rules in [Constraints](binding.md#constraints--when) apply in full to advanced constraints — these are ordinary
`when()` predicates:

- The predicate is called every time a resolve needs to pick a candidate, never cached.
- The predicate must be pure and deterministic — no side effects, no I/O.
- The predicate must not resolve anything. `ConstraintContext` exposes no resolve method, and reaching a container from
  inside a predicate re-enters the selection it is part of.
- Make the predicates mutually exclusive when several bindings of one token use predicate-only `when()`. If ≥ 2
  candidates remain after filtering and the more-specific rule decides nothing, the resolver throws
  `AmbiguousBindingError`.

## Performance note

`whenAnyAncestorIs`, `whenAnyAncestorTagged` and `whenAnyAncestorTaggedAll` walk the whole of `ctx.ancestors` — O(depth)
per resolve. With the shallow dependency graphs that are typical (< 10 levels), the overhead is negligible. Avoid these
constraints on a hot path with a deep graph and `transient` bindings; prefer `whenParentIs` / `whenParentTaggedAll`
(O(1) parent lookup) when checking the direct parent is all you need.

`whenParentTaggedAll(tags)` first compares the condition's tag keys against the parent slot's `keyMask`, ruling out a
parent that lacks one of them without a walk, then checks `tags` against `ctx.parent.slot.tags` — O(m × n) at worst,
where m is the number of tags in the condition and n the number of tags on the parent slot. With small m and n (< 5) the
overhead is negligible; prefer it over AND-composing several `whenParentTagged` calls, to reduce the number of predicate
invocations.

## Subpath export

```ts
// @codefast/di/resolution/select/constraints — src/resolution/select/constraints.ts
export {
  whenAnyAncestorIs,
  whenAnyAncestorNamed,
  whenAnyAncestorTagged,
  whenAnyAncestorTaggedAll,
  whenNoAncestorIs,
  whenNoParentIs,
  whenParentIs,
  whenParentNamed,
  whenParentTagged,
  whenParentTaggedAll,
} from "#resolution/select/constraints";
```

Exported from both the root `@codefast/di` and the subpath `@codefast/di/resolution/select/constraints` — both import
paths are valid and point at the same module. The `exports` map is generated from `dist/`, so the subpath carries the
real source path; **there is no `@codefast/di/constraints` alias**.
