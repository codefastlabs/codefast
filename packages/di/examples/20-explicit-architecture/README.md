# Example 20 — Explicit Architecture (Ports & Adapters)

Every other example lives in a single file to keep one concept in view. This one is deliberately spread across a
directory, because the lesson **is** the structure: how `@codefast/di` wires an application whose domain never imports
the framework.

The scenario is a private bank clearing a large transfer against a closing settlement window: a `LargeTransferAttempted`
event fans out to four subscribers (audit, metrics, fraud, compliance), a branch withdrawal draws the balance down, and
then the domain refuses three operations the rules forbid — an over-limit withdrawal, a deposit to an account that was
never opened, and a cross-currency transfer — before a frozen clock replays the exact instant. It is modelled with
Hexagonal / Onion / Clean layering (what Herberto Graça named _Explicit Architecture_).

```sh
npx tsx examples/20-explicit-architecture/20-explicit-architecture.ts
```

## The dependency rule

Dependencies point **inward**. An inner ring may not name an outer one. The classes are wired with `@injectable` /
`inject`, so the framework reaches every ring **except the innermost** — the domain is the pure core.

```text
        ┌──────────────────────── composition ────────────────────────┐
        │  the composition root: modules bind ports → adapters,        │
        │  Container.fromModules + validate                            │
        │                                                              │
        │   ┌───────────── primary ─────────────┐   ┌ infrastructure ┐ │
        │   │ driving adapters (a controller)    │   │ driven adapters│ │
        │   │            ↓ drives                │   │  ↑ implements  │ │
        │   │   ┌──────────── application ───────────────┐            │ │
        │   │   │  use cases + ports (inbound & outbound) │            │ │
        │   │   │        ┌──────── domain ────────┐       │            │ │
        │   │   │        │ pure — no @codefast/di  │      │            │ │
        │   │   │        │ entities, invariants    │      │            │ │
        │   │   │        └─────────────────────────┘      │            │ │
        │   │   └─────────────────────────────────────────┘            │ │
        │   └────────────────────────────────────────────┘            │ │
        └──────────────────────────────────────────────────────────────┘
```

## Layout

```text
20-explicit-architecture/
├── domain/                      # innermost — pure business rules, NO @codefast/di
│   ├── money.ts                 #   Money value object (same-currency arithmetic)
│   ├── account-id.ts            #   AccountId branded identifier
│   ├── account.ts               #   Account aggregate (owns the overdraft invariant)
│   ├── events.ts                #   domain events
│   └── errors.ts                #   domain error taxonomy (each carries a `code`)
├── application/                 # use cases + the ports they depend on
│   ├── ports/                   #   each port: an interface + its injection token
│   │   ├── account-repository.port.ts   # outbound: persistence
│   │   ├── clock.port.ts                # outbound: time
│   │   ├── id-generator.port.ts         # outbound: identifiers
│   │   ├── events.port.ts               # outbound: publish / subscribe
│   │   ├── request-context.port.ts      # outbound: per-request state
│   │   └── use-cases.port.ts            # inbound: what a driver may call
│   └── use-cases/               #   @injectable classes that orchestrate the domain
│       ├── open-account.ts
│       ├── deposit-money.ts
│       ├── withdraw-money.ts
│       └── transfer-money.ts
├── infrastructure/              # driven adapters — @injectable, implement the outbound ports
│   ├── in-memory-account-repository.ts
│   ├── system-clock.ts
│   ├── sequential-id-generator.ts
│   ├── fan-out-event-publisher.ts       # injectAll(EventHandlerToken) → every subscriber
│   ├── audit-log-handler.ts
│   ├── metrics-handler.ts
│   ├── fraud-engine-handler.ts
│   └── compliance-log-handler.ts
├── primary/                     # driving adapter — @injectable, enters through an inbound port
│   └── banking-controller.ts
├── composition/                 # the composition root
│   ├── tokens.ts                #   the few tokens the root owns (inspection handles, controller)
│   ├── infrastructure.module.ts #   binds outbound ports → adapters
│   ├── application.module.ts    #   binds inbound ports → use cases
│   └── build-container.ts       #   fromModules + validate
└── 20-explicit-architecture.ts  # the runnable driver (composition root + scenario)
```

## Where the framework lives

Decorators are the ergonomic way to wire a class: `@injectable` records what a constructor needs, and the module binds
it with a one-liner — `builder.bind(OpenAccountUseCaseToken).to(OpenAccount).singleton()`. The trade is real: a
decorated class imports `@codefast/di`. So the application, infrastructure, and primary rings all name the framework.

The invariant that still holds — the one that matters most in Explicit Architecture — is that the **domain** never does.
Entities, value objects, and invariants are plain TypeScript. Prove it:

```sh
grep -rl "@codefast/di" domain   # → no matches
```

Each port declares its interface and its token together, so a use case can ask for what it needs by token without any
concrete class in sight:

```ts
@injectable([inject(AccountRepositoryToken), inject(IdGeneratorToken), inject(ClockToken), inject(EventPublisherToken)])
export class OpenAccount implements OpenAccountUseCase {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
    private readonly events: EventPublisher,
  ) {}
  // …
}
```

## Decorators need no extra tooling here

These are TC39 Stage 3 decorators (`experimentalDecorators` is off). The examples run under `tsx`, which transforms them
directly — there is nothing to configure. The package's own unit tests transform the same decorators through
`@babel/plugin-proposal-decorators` only because they run under Vitest; that plugin is a Vitest concern, not something
an example (or a consumer) has to add.

## Which `@codefast/di` feature plays which architectural role

| Architectural concept                  | `@codefast/di` mechanism                             |
| -------------------------------------- | ---------------------------------------------------- |
| Port (interface + identity)            | an interface plus a `token<Interface>()`             |
| Adapter (a concrete implementation)    | an `@injectable` class bound with `.to()`            |
| Declaring a class's dependencies       | `@injectable([inject(Token), …])`                    |
| Many subscribers on one port (fan-out) | one `whenNamed` slot each + `injectAll` / resolveAll |
| Bounded module / layer                 | `Module.create` + `builder.import`                   |
| Unit of work per request               | `scoped()` binding + `createChild()`                 |
| Wire-up check before serving traffic   | `container.validate()`                               |
| Swap an adapter in a test              | `container.rebind(token)`                            |
| Seeing the dependency rule             | `generateDependencyGraph()` + `toDotGraph()`         |

## Is this too many files?

For a service with this much domain logic, no — the layout is what keeps the overdraft rule in one place and lets the
storage engine change without touching it. But the pattern has a real cost, and it is easy to apply where it does not
pay. A three-command CLI wrapped in the same ceremony ends up with dozens of one-method port files for work that fits in
a flat handful — see [`packages/cli/DECISIONS.md`](../../../cli/DECISIONS.md) for a worked account of exactly that
mistake inside this repo. Reach for this structure when the domain earns it, not by default.
