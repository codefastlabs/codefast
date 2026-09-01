# @codefast/di-testing

Solitary and sociable auto-mocking test beds for
[`@codefast/di`](https://github.com/codefastlabs/codefast/tree/main/packages/di) — write an isolated unit test for an
`@injectable` class in two lines, with every collaborator mocked for you, or keep chosen collaborators real.

[![npm version](https://img.shields.io/npm/v/@codefast/di-testing)](https://www.npmjs.com/package/@codefast/di-testing)
[![license](https://img.shields.io/npm/l/@codefast/di-testing)](https://github.com/codefastlabs/codefast/blob/main/LICENSE)

- **Auto-mocking.** `TestBed.solitary(Class)` reads the class's declared dependencies through di's own `MetadataReader`
  and builds a mock for each — no per-collaborator `bind(...).toConstantValue(...)`.
- **Real instance, real wiring.** The unit is constructed through a container, so `@postConstruct`, accessor injection,
  and `@preDestroy` run exactly as in production.
- **Zero test-framework dependency.** The default mock is a small built-in spy. Pass `() => vi.fn()` (or `jest.fn`,
  `() => sinon.stub()`) to build the mocks from that backend and use its matchers instead.
- **Backend-typed lookups.** The factory's return type flows through the whole bed: with `() => vi.fn()`,
  `mocks.get(EmailToken).send` carries Vitest's own mock surface (`mockReturnValueOnce`, `mockClear`, …) — no adapter
  package, no module augmentation, no postinstall scripts.

## Requirements

- **Node.js 24 or later**, matching `@codefast/di`.
- A peer install of `@codefast/di` with `@injectable` / `inject` classes to test.
- Types for `AsyncDisposable` (`await using`): `@types/node` provides them; without it, add `"ESNext.Disposable"` to
  your tsconfig `lib`.

## Installation

```bash
pnpm add -D @codefast/di-testing
```

## Quick start

```typescript
import { inject, injectable, token } from "@codefast/di";
import { TestBed } from "@codefast/di-testing";
import { expect, it, vi } from "vitest";

const UserServiceToken = token<UserService>("UserService");
const PaymentGatewayToken = token<PaymentGateway>("PaymentGateway");
const EmailServiceToken = token<EmailService>("EmailService");

@injectable([inject(UserServiceToken), inject(PaymentGatewayToken), inject(EmailServiceToken)])
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

The zero-dependency default reads the same, minus the `mockFactory` — assert against the built-in spy's `.mock.calls`
and stub with `.mockReturnValue()`:

```typescript
import { TestBed } from "@codefast/di-testing";
import assert from "node:assert/strict";

const { unit, mocks } = TestBed.solitary(OrderProcessor).compile();
unit.placeOrder("u1", 42);
assert.deepEqual(mocks.get(PaymentGatewayToken).charge.mock.calls[0], ["u1", 42]);
```

## API

### `TestBed.solitary(target, options?)`

Begins a solitary test bed for `target`, auto-mocking every dependency it declares. `options`:

- `mockFactory?: () => spy` — the spy backend for each auto-mock. Defaults to the built-in zero-dependency spy.
- `metadataReader?: MetadataReader` — the reader dependencies are discovered through. Defaults to di's reader.

### Builder

- `.mock(token).stub((fn) => stub)` — bind a partial stub built from the active spy factory; unlisted members stay
  auto-mocked. `fn()` is typed as whatever the backend produces, so `fn().mockReturnValue(...)` (jest-shaped) or
  `fn().returns(...)` (Sinon) both type-check against the factory you chose.
- `.mock(token).using(value)` — bind a fixed value. The value is **sealed**: it has no mock surface, so `mocks.get`
  refuses it rather than hand it back mistyped — the test already holds the reference it passed in.
- `.mock(token).absent()` — leave the dependency unbound: an `optional()` slot resolves `undefined`, an `injectAll()`
  slot `[]`. Anything else is an `OverrideMismatchError`.
- `.mock(token).usingAll([a, b])` — supply the elements of an unconstrained `injectAll()` slot, in order. Sealed like
  `.using`.
- `.mock(token, { name })` / `.mock(token, { tag })` — target one slot of a token that is injected several ways; the
  slotless form covers every slot without a more specific override.
- `.compile()` — instantiate the unit synchronously (the primary path).
- `.compileAsync()` — for a unit whose `@postConstruct` is asynchronous.

### `TestBed.sociable(target, options?)`

A sociable bed keeps chosen collaborators real while everything else stays mocked — a unit test over a small real
subtree, not an integration test. It returns only `.expose()`, steering the first call:

```typescript
const bed = TestBed.sociable(CheckoutService, { mockFactory: () => vi.fn() })
  .expose(PricingService) // real instance, wired through the container
  .mock(TaxPolicyToken)
  .stub((fn) => ({ rateFor: fn().mockReturnValue(0.1) }))
  .compile();

bed.unit.checkout(100, "USD"); // real PricingService math over the mocked tax boundary
bed.exposed(PricingService); // the real instance the unit was built with
```

- **Exposure follows class identity.** A class-keyed dependency — of the unit or of another exposed class — stays real
  when exposed, and its own dependencies follow the same rules recursively.
- **Tokens are the boundary.** A `Token`-keyed dependency is always mocked, in both modes: tokens mark where the logic
  under test meets the outside world.
- Exposed collaborators are real singletons resolved through the container, so their `@postConstruct` runs at compile
  and `@preDestroy` on dispose. `bed.exposed(Class)` retrieves them; `mocks.get(Class)` refuses them
  (`SealedDependencyError`) because they carry no mock surface.
- Exposing a class the unit never reaches, or exposing and mocking the same class, is an error at compile.

### Behavior notes

- An `optional()` dependency is auto-mocked like any other — it resolves to the mock, not `undefined` as an unbound
  optional would in production. Use `.mock(token).absent()` to exercise the absent branch.
- An `injectAll()` dependency receives a one-element array holding the token's mock; use `.mock(token).usingAll([...])`
  to supply several elements. When the same token also has a named or tagged slot, that slot's binding is collected by
  the unconstrained `injectAll` too — di's `resolveAll` takes every binding of the token.
- Named or tagged parameters of one token share the token's mock unless a slot-targeted `.mock(token, { name })` gives
  that slot its own; either way `mocks.get(token, { name })` addresses the slot directly.

### Result — `UnitTestBed`

- `unit` — the real class under test.
- `mocks.get(token, options?)` — the `Mocked<T>` bound for a dependency (or one slot of it). Only auto-mocks and `.stub`
  stubs come back; sealed values throw `SealedDependencyError`.
- `resetMocks()` — clear the call history and configured behaviour of every auto-mock the bed created.
- `dispose()` — run the unit's `@preDestroy` hooks and dispose the container. Also runs via `await using`.

## Errors

- `NotInjectableError` — the class under test takes constructor parameters but is not `@injectable`.
- `UndeclaredDependencyError` — a `.mock(...)` or `mocks.get(...)` named a token or slot the class does not use.
- `SealedDependencyError` — `mocks.get(...)` asked for a `.using()`/`.absent()`/`.all()` value.
- `OverrideMismatchError` — `.absent()` on a required dependency, or `.all()` on a non-`injectAll` slot.

## License

MIT
