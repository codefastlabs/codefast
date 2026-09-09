/**
 * `@codefast/di` — the multi-tag lane's key-mask prefilter (codefast-only).
 *
 * A slot matches only if the request carries **every** key the slot declares, which is a subset test
 * a `Map` cannot answer in one lookup. The lane therefore ORs each slot's tag keys into one word and
 * rejects on `(requestMask & slotMask) !== slotMask` before reading a single criterion. These rows
 * exist to price that, and they are shaped so the prefilter is the variable:
 *
 *   - `mask-reject-wide-catalog` — 32 candidates, 31 of which declare a key the request never names.
 *     Every rejection is one AND plus one compare; without the mask each would walk its own tags.
 *     This is the row the prefilter is for.
 *   - `mask-accept-two-of-four` — the mirror image: the request carries four keys and the winning
 *     slot declares two of them, so the mask admits and the identity comparison decides. Prices what
 *     the prefilter costs when it cannot reject.
 *   - `mask-collision-same-bit` — two keys whose ids are 32 apart share a mask bit, so the mask
 *     admits a slot it cannot settle and identity has to reject it. The false-positive path, which
 *     must stay correct and should not be pathological.
 *
 * All three carry `excludeFromAggregates`: they are instrumentation for one lane, not head-to-head
 * rows, and inversify 8 has no multi-tag request to compare against.
 */
import type { BindingTag, TagKey } from "@codefast/di";
import { Container, tag, token } from "@codefast/di";

import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

const MASK_BATCH = 300;

interface MaskedService {
  readonly label: string;
}

/**
 * Distinct keys, declared here so their ids are contiguous.
 *
 * @remarks Contiguity is what makes the collision row below reachable: ids wrap every 32, so the
 * pair that shares a bit has to be 32 apart in declaration order.
 */
const WIDE_KEYS: ReadonlyArray<TagKey<number>> = Array.from({ length: 32 }, (_unused, index) =>
  tag<number>(`mask-wide-${String(index)}`),
);

/** The request names only the first key, so 31 of the 32 candidates fail the mask outright. */
function buildMaskRejectWideCatalogScenario(): BenchScenario {
  const serviceToken = token<MaskedService>("bench-cf-mask-wide");
  const container = Container.create();

  for (const [index, key] of WIDE_KEYS.entries()) {
    container
      .bind(serviceToken)
      .toConstantValue({ label: `k${String(index)}` })
      .whenTagged(key.of(index));
  }

  const request: ReadonlyArray<BindingTag> = [WIDE_KEYS[0]!.of(0)];

  container.resolveAll(serviceToken, { tags: request });

  return {
    id: "mask-reject-wide-catalog",
    facets: ["tag"],
    group: "slot-selection",
    what: "resolveAll over 32 single-tag candidates where 31 fail the key-mask subset test (codefast-only)",
    batch: MASK_BATCH,
    excludeFromAggregates: true,
    sanity: () => {
      const found = container.resolveAll(serviceToken, { tags: request });
      return found.length === 1 && found[0]?.label === "k0";
    },
    build: () =>
      batched(MASK_BATCH, () => {
        container.resolveAll(serviceToken, { tags: request });
      }),
  };
}

const ACCEPT_A = tag<string>("mask-accept-a");
const ACCEPT_B = tag<string>("mask-accept-b");
const ACCEPT_C = tag<string>("mask-accept-c");
const ACCEPT_D = tag<string>("mask-accept-d");

/** The mask admits and identity decides: the cost of the prefilter when it cannot reject. */
function buildMaskAcceptTwoOfFourScenario(): BenchScenario {
  const serviceToken = token<MaskedService>("bench-cf-mask-accept");
  const container = Container.create();

  container
    .bind(serviceToken)
    .toConstantValue({ label: "ab" })
    .whenTagged(ACCEPT_A.of("x"))
    .whenTagged(ACCEPT_B.of("y"));
  container
    .bind(serviceToken)
    .toConstantValue({ label: "cd" })
    .whenTagged(ACCEPT_C.of("x"))
    .whenTagged(ACCEPT_D.of("y"));

  // Four keys requested; each candidate declares two of them, so both pass the mask and only the
  // criterion identities separate them.
  const request: ReadonlyArray<BindingTag> = [ACCEPT_A.of("x"), ACCEPT_B.of("y"), ACCEPT_C.of("z"), ACCEPT_D.of("z")];

  container.resolve(serviceToken, { tags: request });

  return {
    id: "mask-accept-two-of-four",
    facets: ["tag"],
    group: "slot-selection",
    what: "resolve where the request names four keys and the winner declares two — mask admits, identity decides (codefast-only)",
    batch: MASK_BATCH,
    excludeFromAggregates: true,
    sanity: () => container.resolve(serviceToken, { tags: request }).label === "ab",
    build: () =>
      batched(MASK_BATCH, () => {
        container.resolve(serviceToken, { tags: request });
      }),
  };
}

/**
 * Two keys 32 ids apart, so they share a mask bit.
 *
 * @remarks Declared after the 32 wide keys and the four accept keys, then padded, so the pair below
 * lands on the same bit. The mask admits the wrong slot and identity has to reject it — the
 * false-positive path the prefilter is allowed to have, but must survive.
 */
const COLLIDE_FIRST = tag<string>("mask-collide-first");
// Consumed for its side effect on the id counter, which is the whole point of it.
Array.from({ length: 31 }, (_unused, index) => tag<string>(`mask-collide-pad-${String(index)}`));
const COLLIDE_SECOND = tag<string>("mask-collide-second");

function buildMaskCollisionScenario(): BenchScenario {
  const serviceToken = token<MaskedService>("bench-cf-mask-collide");
  const container = Container.create();

  container.bind(serviceToken).toConstantValue({ label: "first" }).whenTagged(COLLIDE_FIRST.of("v"));
  container.bind(serviceToken).toConstantValue({ label: "second" }).whenTagged(COLLIDE_SECOND.of("v"));

  const request: ReadonlyArray<BindingTag> = [COLLIDE_FIRST.of("v")];

  container.resolveAll(serviceToken, { tags: request });

  return {
    id: "mask-collision-same-bit",
    facets: ["tag"],
    group: "slot-selection",
    what: "resolveAll where two tag keys share a mask bit, so the prefilter admits a slot identity must reject (codefast-only)",
    batch: MASK_BATCH,
    excludeFromAggregates: true,
    sanity: () => {
      // The padding is what puts the two keys 32 apart; if that ever drifts the row still has to
      // answer correctly, so the assertion is on the result, not on the ids.
      const sameBit = COLLIDE_FIRST.mask === COLLIDE_SECOND.mask;
      const found = container.resolveAll(serviceToken, { tags: request });
      return sameBit && found.length === 1 && found[0]?.label === "first";
    },
    build: () =>
      batched(MASK_BATCH, () => {
        container.resolveAll(serviceToken, { tags: request });
      }),
  };
}

/**
 * The three key-mask rows, in the order the doc comment above introduces them.
 *
 * @since 0.6.0
 */
export function buildCodefastTagKeyMaskScenarios(): ReadonlyArray<BenchScenario> {
  return [buildMaskRejectWideCatalogScenario(), buildMaskAcceptTwoOfFourScenario(), buildMaskCollisionScenario()];
}
