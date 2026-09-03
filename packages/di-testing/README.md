# @codefast/di-testing

Solitary and sociable auto-mocking test beds for [`@codefast/di`](../di): unit-test an `@injectable` class with every
collaborator mocked for you, or keep chosen collaborators real.

[![npm version](https://img.shields.io/npm/v/@codefast/di-testing)](https://www.npmjs.com/package/@codefast/di-testing)
[![license](https://img.shields.io/npm/l/@codefast/di-testing)](./LICENSE)

## Overview

`@codefast/di-testing` gives you two auto-mocking test beds for [`@codefast/di`](../di). A **solitary** bed constructs
the class under test with every collaborator mocked for you; a **sociable** bed keeps chosen collaborators real and
mocks the rest.

The unit is built through a real container, so `@postConstruct`, accessor injection, and `@preDestroy` run exactly as in
production — and you assert against the mocks the bed created.

- **Auto-mocking.** `TestBed.solitary(Class)` reads the class's declared dependencies through di's own `MetadataReader`
  and builds a mock for each — no per-collaborator `bind(...).toConstantValue(...)`.
- **Real instance, real wiring.** The unit is constructed through a container, so `@postConstruct`, accessor injection,
  and `@preDestroy` run exactly as in production.
- **Zero test-framework dependency.** The default mock is a small built-in spy. Pass `() => vi.fn()` — or `jest.fn`,
  `() => sinon.stub()` — to build the mocks from that backend and use its matchers instead.
- **Backend-typed lookups.** The factory's return type flows through the whole bed: with `() => vi.fn()`,
  `mocks.get(EmailToken).send` carries Vitest's own mock surface (`mockReturnValueOnce`, `mockClear`, and so on), with
  no adapter package and no module augmentation.

## Installation

```bash
pnpm add -D @codefast/di-testing
```

`@codefast/di-testing` requires Node.js 24 or later and a peer install of `@codefast/di` (`>=0.8.0`), with the same
TypeScript setup: native Stage 3 decorators, `experimentalDecorators` off. The package is published on 0.x and versioned
on its own track: breaking changes ship as minor versions, so pin the minor version when you need stability.

## Quick start

```ts
import { injectable, token } from "@codefast/di";
import { TestBed } from "@codefast/di-testing";
import { expect, it, vi } from "vitest";

interface UserService {
  findUser(id: string): { id: string; email: string };
}
interface PaymentGateway {
  charge(userId: string, amount: number): void;
}
interface EmailService {
  send(to: string, body: string): void;
}

const UserServiceToken = token<UserService>("UserService");
const PaymentGatewayToken = token<PaymentGateway>("PaymentGateway");
const EmailServiceToken = token<EmailService>("EmailService");

@injectable([UserServiceToken, PaymentGatewayToken, EmailServiceToken])
class OrderProcessor {
  constructor(
    private readonly users: UserService,
    private readonly payments: PaymentGateway,
    private readonly email: EmailService,
  ) {}

  placeOrder(userId: string, amount: number): string {
    const user = this.users.findUser(userId);
    this.payments.charge(userId, amount);
    this.email.send(user.email, `Order confirmed — ${amount}`);
    return `ord-${userId}`;
  }
}

it("charges then emails a confirmation", () => {
  const { unit, mocks } = TestBed.solitary(OrderProcessor, { mockFactory: () => vi.fn() })
    .mock(UserServiceToken)
    .stub((fn) => ({ findUser: fn().mockReturnValue({ id: "u1", email: "alice@example.com" }) }))
    .compile();

  unit.placeOrder("u1", 42);

  expect(mocks.get(PaymentGatewayToken).charge).toHaveBeenCalledWith("u1", 42);
  expect(mocks.get(EmailServiceToken).send).toHaveBeenCalledWith("alice@example.com", "Order confirmed — 42");
});
```

The zero-dependency default reads the same, minus the `mockFactory`. Assert against the built-in spy's `.mock.calls` and
stub with `.mockReturnValue()`:

```ts
import { TestBed } from "@codefast/di-testing";
import assert from "node:assert/strict";

const { unit, mocks } = TestBed.solitary(OrderProcessor).compile();
unit.placeOrder("u1", 42);
assert.deepEqual(mocks.get(PaymentGatewayToken).charge.mock.calls[0], ["u1", 42]);
```

## Solitary beds

`TestBed.solitary(target, options?)` begins a bed for `target` and auto-mocks every dependency it declares. Nothing is
instantiated until you call `compile()`. The options:

- `mockFactory?: () => spy` — the spy backend each auto-mock is built from. Defaults to the built-in spy.
- `metadataReader?: MetadataReader` — the reader dependencies are discovered through. Defaults to di's reader.

The builder records overrides, then compiles:

- `.mock(token).stub((fn) => stub)` — bind a partial stub built from the active spy factory; unlisted members stay
  auto-mocked. `fn()` is typed as whatever the backend produces, so `fn().mockReturnValue(...)` (jest-shaped) or
  `fn().returns(...)` (Sinon) type-check against the factory you chose.
- `.mock(token).using(value)` — bind a fixed value. The value is **sealed**: it has no mock surface, so `mocks.get`
  refuses it rather than hand it back mistyped — the test already holds the reference it passed in.
- `.mock(token).absent()` — leave the dependency unbound: an `optional()` slot resolves `undefined`, an `injectAll()`
  slot `[]`. On a required dependency this is an `OverrideMismatchError`.
- `.mock(token).usingAll([a, b])` — supply the elements of an unconstrained `injectAll()` slot, in order. Sealed like
  `.using`.
- `.mock(token, { name })` / `.mock(token, { tag })` — target one slot of a token that is injected several ways; the
  slotless form covers every slot without a more specific override. Registering the same target twice replaces the
  earlier override.
- `.compile()` — instantiate the unit synchronously, running accessor injection and `@postConstruct`.
- `.compileAsync()` — the same for a unit whose `@postConstruct` is asynchronous.

`.mock(...)` accepts a token or a class, matching how the unit declares the dependency.

## Sociable beds

A sociable bed keeps chosen collaborators real while everything else stays mocked — a unit test over a small real
subtree, not an integration test. `TestBed.sociable(target, options?)` takes the same options and returns only
`.expose()`, because a sociable bed with nothing exposed is a solitary bed.

```ts
import { injectable, token } from "@codefast/di";
import { TestBed } from "@codefast/di-testing";
import { expect, it, vi } from "vitest";

interface TaxPolicy {
  rateFor(currency: string): number;
}

const TaxPolicyToken = token<TaxPolicy>("TaxPolicy");

@injectable([TaxPolicyToken])
class PricingService {
  constructor(private readonly tax: TaxPolicy) {}

  total(amount: number, currency: string): number {
    return amount * (1 + this.tax.rateFor(currency));
  }
}

@injectable([PricingService])
class CheckoutService {
  constructor(private readonly pricing: PricingService) {}

  checkout(amount: number, currency: string): number {
    return this.pricing.total(amount, currency);
  }
}

it("prices through the real PricingService over a mocked tax boundary", () => {
  const bed = TestBed.sociable(CheckoutService, { mockFactory: () => vi.fn() })
    .expose(PricingService)
    .mock(TaxPolicyToken)
    .stub((fn) => ({ rateFor: fn().mockReturnValue(0.1) }))
    .compile();

  expect(bed.unit.checkout(100, "USD")).toBe(110);
  expect(bed.exposed(PricingService)).toBeInstanceOf(PricingService);
});
```

- **Exposure follows class identity.** A class-keyed dependency — of the unit or of another exposed class — stays real
  when exposed, and its own dependencies follow the same rules recursively.
- **Tokens are the boundary.** A `Token`-keyed dependency is always mocked, in both modes: tokens mark where the logic
  under test meets the outside world.
- Exposed collaborators are singletons resolved through the container, so their `@postConstruct` runs at compile and
  `@preDestroy` on dispose. `bed.exposed(Class)` returns the instance the unit was built with; `mocks.get(Class)`
  refuses it with a `SealedDependencyError` because it carries no mock surface.
- Exposing the unit itself, or a class the unit never reaches through exposed collaborators, is an `ExposureError` at
  compile.

## Behaviour notes

- A class whose constructor takes no parameters is testable without `@injectable`; a parameterful constructor with no
  metadata is a `NotInjectableError`.
- An `optional()` dependency is auto-mocked like any other — it resolves to the mock, not to the `undefined` an unbound
  optional would give in production. Use `.mock(token).absent()` to exercise the absent branch.
- An `injectAll()` dependency receives a one-element array holding the token's mock; use `.mock(token).usingAll([...])`
  to supply several elements.
- Named or tagged parameters of one token share the token's mock unless a slot-targeted `.mock(token, { name })` gives
  that slot its own; either way `mocks.get(token, { name })` addresses the slot directly.
- A `.mock(...)` that names a token or slot the unit does not declare is an `UndeclaredDependencyError` at compile — a
  typo fails loudly instead of binding an unused constant.
- A failed compile disposes the container it was building, so no lifecycle state leaks between tests.

## Result

`compile()` returns a `UnitTestBed` (a sociable bed returns a `SociableUnitTestBed`, which adds `exposed`):

- `unit` — the real class under test.
- `mocks.get(token, options?)` — the `Mocked<T>` bound for a dependency, or for one slot of it. Only auto-mocks and
  `.stub` stubs come back; sealed values and exposed classes throw `SealedDependencyError`.
- `resetMocks()` — clear the call history and configured behaviour of every auto-mock and stub the bed created.
- `dispose()` — run the unit's `@preDestroy` hooks and dispose the container.

The bed implements `AsyncDisposable`, so `await using bed = TestBed.solitary(X).compile()` disposes it at the end of the
block; that needs the `esnext.disposable` lib in your TypeScript configuration if your `target` does not include it.

The lower-level pieces are exported too: `createAutoMock`, `createSpy`, `defaultMockFactory`, and the `Mocked`,
`DeepPartial`, `MockFactory`, and `Spy` types.

## Errors

Every error extends `TestingError` and carries a stable `code`. `TestingError` mirrors di's `DiError` shape without
extending it, so setup failures can be caught separately from resolution failures.

| Error                       | Code                    | Raised when                                                                                         |
| --------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------- |
| `NotInjectableError`        | `NOT_INJECTABLE`        | A scanned class takes constructor parameters but is not `@injectable`                               |
| `UndeclaredDependencyError` | `UNDECLARED_DEPENDENCY` | A `.mock(...)` or `mocks.get(...)` named a token or slot the unit does not use                      |
| `SealedDependencyError`     | `SEALED_DEPENDENCY`     | `mocks.get(...)` asked for a `.using()`/`.absent()`/`.usingAll()` value or an exposed class         |
| `OverrideMismatchError`     | `OVERRIDE_MISMATCH`     | `.absent()` on a required dependency, or `.usingAll()` with no unconstrained `injectAll()` slot     |
| `ExposureError`             | `EXPOSURE`              | An exposed class is the unit, is unreachable, or `bed.exposed()` names a class that was not exposed |

## Documentation

- [Rendered docs on codefastlabs.com](https://codefastlabs.com/docs/di-testing)
- [`@codefast/di`](../di/README.md) — the container this package builds on, including its `SPEC.md`.
- [`CHANGELOG.md`](./CHANGELOG.md) — release history.

## Contributing

See the repo-wide [contributing guide](../../CONTRIBUTING.md) for setup, conventions, and the test taxonomy.

## License

Released under the [MIT License](./LICENSE).
