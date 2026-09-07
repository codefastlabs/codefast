/**
 * Example 21 — Explicit Architecture (E-commerce).
 *
 * @remarks
 * A larger, multi-context Explicit Architecture example wired with `@injectable` / `inject` decorators,
 * like Example 20 but spread across several bounded contexts (catalog, order, payment), two transports
 * over one use case (HTTP + CLI), and config-selected adapters. Decorated classes name `@codefast/di`,
 * but the `domain` ring never does — its entities, value objects, and invariants stay plain TypeScript.
 *
 * The scenario runs NeonCart's Black Friday drop: a shopper buys over HTTP and the warehouse holds the
 * last stock for a VIP over the CLI (the same `PlaceOrder` use case behind both), then three checkouts
 * are refused at the boundary — an oversell (`OUT_OF_STOCK`), an unsettleable currency
 * (`UNSUPPORTED_CURRENCY`), and a declined charge after `rebind` swaps in a failing gateway
 * (`PAYMENT_DECLINED`) — each mapped to HTTP 422.
 *
 * The thin file below just runs the composition root's bootstrap so the example runner can pick it up.
 */

import { bootstrap } from "#/examples/21-explicit-architecture-ecommerce/composition/bootstrap";

await bootstrap();
