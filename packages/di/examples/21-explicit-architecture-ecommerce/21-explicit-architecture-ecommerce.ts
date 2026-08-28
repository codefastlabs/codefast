/**
 * Example 21 — Explicit Architecture (E-commerce).
 *
 * @remarks
 * A larger, multi-context Explicit Architecture example built in the purist style: `@codefast/di` is
 * imported in exactly one ring — `composition` — and nowhere else. The `domain`, `application`,
 * `infrastructure`, and `presentation` layers are plain TypeScript with no framework knowledge; the
 * composition root wires every plain class together with factories. It complements Example 20, which
 * wires the same idea with `@injectable` decorators.
 *
 * The thin file below just runs the composition root's bootstrap so the example runner can pick it up.
 */

import { bootstrap } from "#/examples/21-explicit-architecture-ecommerce/composition/bootstrap";

await bootstrap();
