# Example 13: E-Commerce Platform (Bounded Contexts)

Walkthrough of `13-ecommerce-platform.ts`: a **single-file, domain-rich** backend sketch that wires a full customer journey through `@codefast/di`—from async infrastructure to per-request checkout orchestration.

> This is a **runnable simulation**: Postgres, Redis, S3, Elasticsearch, Stripe, and so on are **mocked** with realistic delays and logs. The value is the **composition graph**, not external services.

## Overview

The example answers: _“How do I organize a non-trivial product into modules, lifetimes, and cross-cutting infrastructure without turning `main()` into a ball of mud?”_

- **Bounded contexts** (Catalog, Cart, Orders, Payments, Users, Notifications, Analytics) each map to `Module.create` / `Module.createAsync` registrations.
- **Infrastructure** (DB pool connect, Redis connect) uses async activation and deactivation hooks.
- **Multi-binding** models payment gateways, shipping carriers, and notification channels (`injectAll` / `resolveAll` patterns).
- **Per-request isolation** uses a **child container** so `UserSession` and scoped checkout logic do not leak across concurrent HTTP-shaped requests.

## 1. High-level architecture

`bootstrap()` builds **one** root container from **three sibling modules** (none of them `import`s the others at module level—merge happens in `fromModulesAsync`):

- **InfraModule** (`Module.createAsync`): config + logger + id generator + DB/Redis/S3/ES/EventBus.
- **PaymentModule** (`Module.create`): named gateways + `PaymentProcessor` / `PaymentServiceToken`.
- **AppModule** (`Module.create`): imports domain modules below, binds placeholder `SessionToken`, registers **scoped** `CheckoutOrchestrator`.

```mermaid
flowchart TB
  subgraph Merge["One root container = merge of three modules"]
    direction LR
    Infra[InfraModule async]
    Pay[PaymentModule]
    App[AppModule]
  end

  subgraph AppBody["Inside AppModule registrations"]
    direction TB
    CAT[CatalogModule]
    CRT[CartModule]
    ORD[OrderModule]
    SHP[ShippingModule]
    USR[UserModule]
    NTF[NotificationModule]
    ANA[AnalyticsModule]
    TOK["SessionToken + CheckoutOrchestrator scoped"]
  end

  App --> AppBody
  CRT -->|builder.import| CAT
  ORD -->|builder.import| SHP
```

`InfraModule`, `PaymentModule`, and `AppModule` are **not** linked by `builder.import` to each other; the container **merges** their binding tables. Domain services and `CheckoutOrchestrator` then **resolve** tokens that were registered in `InfraModule` (e.g. `DatabaseToken`, `LoggerToken`, `RedisToken`, `EventBusToken`) or `PaymentModule` (`PaymentServiceToken`, gateways) alongside tokens from the `AppModule` subtree.

## 2. Bootstrap sequence

Async **connect** for `MockDatabase` / `MockRedis` is wired with `.onActivation` on their bindings; in this demo those instances are created when the container **initializes** singletons, not at an arbitrary earlier step.

```mermaid
sequenceDiagram
  participant Main
  participant C as Root container
  participant DB as MockDatabase
  participant R as MockRedis

  Main->>C: await fromModulesAsync(InfraModule, PaymentModule, AppModule)
  Note right of C: Infra async builder: loadAppConfig + register binds<br/>Payment + App sync builders: register binds<br/>No checkout request yet

  Main->>C: await initializeAsync()
  Note over C,DB: First touch of infra singletons runs hooks
  C->>DB: onActivation → connect()
  C->>R: onActivation → connect()
  Note right of C: Other singletons resolve too e.g. PricingManager @postConstruct warm-up

  Main->>C: validate()

  Main->>C: resolve(EventBus, Loyalty, Notification, User) + subscribe order.created

  Note over Main: handleCheckoutRequest: createChild + rebind SessionToken + resolve scoped orchestrator

  Main->>C: await dispose() on shutdown
  C->>R: onDeactivation → quit()
  C->>DB: onDeactivation → close()
```

## 3. Checkout journey (application service)

`CheckoutOrchestrator.completeCheckoutJourney` is the **application** flow. **Order confirmation email** and **loyalty points** are **not** called from this class: `OrderManager.createFromCart` publishes `order.created`, and **root** `EventBus` subscribers registered in `bootstrap()` handle those side effects (possibly interleaved with later orchestrator steps when handlers run).

```mermaid
sequenceDiagram
  participant RC as Child container
  participant O as CheckoutOrchestrator
  participant Ab as AbTestService optional
  participant Cart as CartService
  participant Cat as CatalogService
  participant Usr as UserService
  participant Ful as FulfillmentService
  participant Ord as OrderService
  participant EB as EventBus
  participant Loy as Loyalty subscriber
  participant Nfo as Order-confirm subscriber
  participant Pay as PaymentService
  participant Ntf as NotificationService
  participant Ana as AnalyticsService optional

  RC->>O: resolve CheckoutApplicationServiceToken after SessionToken rebind

  O->>Ab: getVariant (skipped if optional unbound)
  O->>Cart: getOrCreateCart(session)
  O->>Cat: listFeaturedProducts
  loop up to 3 featured SKUs
    O->>Cart: addItem(cartId, productId, 1)
  end
  O->>Cart: applyCoupon WELCOME20 (try/catch, keep prior cart on failure)
  O->>Usr: getUserProfile + listUserAddresses
  O->>Cart: reserveInventoryForCheckout(cart.id)
  O->>Ful: listShippingQuotes(address, items)
  Note right of Ful: quotes sorted by cost ascending first quote wins
  O->>Ord: createFromCart(...)
  Ord->>EB: publish order.created
  par order.created handlers registered in bootstrap
    EB->>Loy: awardPoints(userId, total)
  and
    EB->>Nfo: resolve order + user then sendOrderConfirmationNotification
  end

  O->>Pay: capturePayment(order, stripe)
  Note right of Pay: on failure retries another gateway that supports currency
  O->>Ful: createShipment(orderId, carrierId, address)
  O->>Ntf: sendShippingUpdateNotification (separate from order confirmation)
  O->>Ana: track checkout_completed (skipped if optional unbound)
  O->>Cart: clearCart(cartAfterDiscount.id)
```

Each concurrent “request” in `main()` calls `rootContainer.createChild()`, re-binds `SessionToken`, and resolves a **fresh** scoped orchestrator—mirroring per-request DI in a real HTTP server.

## 4. Multi-bindings in one glance

| Token / axis                                               | Implementations                                           | Consumed by                                                               |
| ---------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------- |
| `PaymentGatewayToken` (named: `stripe`, `paypal`, `cod`)   | `StripeGateway`, `PayPalGateway`, `CashOnDeliveryGateway` | `PaymentProcessor` (`injectAll`) with runtime selection + fallback charge |
| `ShippingCarrierToken` (named: `fedex`, `ups`, `dhl`)      | `FedExCarrier`, `UpsCarrier`, `DhlCarrier`                | `ShippingFulfillmentService` (`injectAll`) for quote aggregation          |
| `NotificationChannelToken` (named: `email`, `sms`, `push`) | `EmailChannel`, `SmsChannel`, `PushChannel`               | `NotificationDispatcher` filters `canHandle` then broadcasts              |

## Key DI patterns demonstrated

| Feature                                                  | Where it shows up                                   |
| -------------------------------------------------------- | --------------------------------------------------- |
| `Module.createAsync` + `onActivation` / `onDeactivation` | `InfraModule` for DB/Redis lifecycle                |
| `Module.create` + `builder.import`                       | Catalog/Cart diamond (Cart imports Catalog)         |
| Named multi-bindings + `injectAll`                       | Payments, shipping, notifications                   |
| Scoped services + `createChild`                          | `CheckoutOrchestrator` + per-request `SessionToken` |
| `optional()` injection                                   | `AnalyticsService`, `AbTestService` on orchestrator |
| `@postConstruct` / `@preDestroy`                         | `PricingManager` cache warm-up / flush              |
| `container.validate()`                                   | Catch captive-dependency mistakes before traffic    |
| `container.initializeAsync()`                            | Warm singleton graph after async module load        |
| `generateDependencyGraph` + `toDotGraph`                 | Export DOT for Graphviz                             |

## Run it

From the `packages/di` package root:

```bash
cd packages/di
npx tsx examples/13-ecommerce-platform/13-ecommerce-platform.ts
```

You should see structured JSON logs (logger), bootstrap banners, three concurrent checkouts, a sample catalog search, dependency-graph stats, and a graceful shutdown banner.

## Files

| File                                                     | Role                                                                         |
| -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [`13-ecommerce-platform.ts`](./13-ecommerce-platform.ts) | Entire platform: tokens, domain types, modules, bootstrap, `main()` scenario |

For smaller focused demos of individual mechanics, start with [01-basic-tokens](../01-basic-tokens/README.md) through [06-constraints-multi-binding](../06-constraints-multi-binding/README.md), then return here for the **integrated** story.
