import { tv } from "#index";
import type { TailwindVariantsFactory, TailwindVariantsOptions, VariantSchema, VariantSelection } from "#index";

/** Calls one resolver makes before every lane has answered: cold first, then the compiled plan, then its store. */
const CALLS_PER_RESOLVER = 5;

/**
 * Reads one fresh resolver once per call until every lane has answered, in call order.
 *
 * @remarks A fresh resolver answers its first call from the configuration, compiles on the second
 * (with slots) or third (without), and answers a repeat from its store, so five calls reach all three.
 */
export const readEveryLane = <Resolver>(
  createResolver: () => Resolver,
  read: (resolver: Resolver) => unknown,
): ReadonlyArray<unknown> => {
  const resolver = createResolver();
  const answers: Array<unknown> = [];

  for (let call = 0; call < CALLS_PER_RESOLVER; call++) {
    answers.push(read(resolver));
  }

  return answers;
};

/** The answers `readEveryLane` returns when every lane agrees on `expected`. */
export const everyLane = (expected: unknown): ReadonlyArray<unknown> => {
  return Array.from({ length: CALLS_PER_RESOLVER }, () => expected);
};

/**
 * The ways a resolver can answer a call: from the configuration, from its compiled plan, or from its store.
 */
export const LANES = ["cold", "compiled", "cached"] as const;

/** One of the ways a resolver can answer a call. */
export type Lane = (typeof LANES)[number];

type AnyProps = VariantSelection<VariantSchema> | undefined;
type AnySlotResolver = (props?: AnyProps) => unknown;
type AnyResolver = ((props?: AnyProps) => unknown) & { config: unknown; variantKeys: unknown };

/** A slot object whose every slot is read twice, so the answer comes from the per-slot memo. */
const readSlotsTwice = (slots: Record<string, AnySlotResolver>): Record<string, AnySlotResolver> => {
  const twice: Record<string, AnySlotResolver> = {};

  for (const name of Object.keys(slots)) {
    const slot = slots[name] as AnySlotResolver;

    twice[name] = (props) => {
      slot(props);

      return slot(props);
    };
  }

  return twice;
};

/** Spends a fresh resolver's cold calls, so its next call compiles the plan. */
const spendColdCalls = (resolver: AnyResolver): void => {
  // A slot resolver answers one call cold, one without slots two.
  if (typeof resolver() === "string") {
    resolver();
  }
};

/**
 * A `tv` whose resolvers answer every call on one lane.
 *
 * @remarks `cold` defines a fresh resolver per call; `compiled` spends the cold calls up front, so
 * each new selection walks the plan; `cached` asks twice and keeps the second answer, slots included,
 * so it comes from the store and the per-slot memo.
 */
export const tvOn = (lane: Lane): TailwindVariantsFactory => {
  const define = (configuration: Parameters<TailwindVariantsFactory>[0], options?: TailwindVariantsOptions) => {
    const resolver: AnyResolver = tv(configuration, options);

    if (lane === "cold") {
      const fresh = (props?: AnyProps): unknown => {
        const coldResolver: AnyResolver = tv(configuration, options);

        return coldResolver(props);
      };

      return Object.assign(fresh, { config: resolver.config, variantKeys: resolver.variantKeys });
    }

    spendColdCalls(resolver);

    if (lane === "compiled") {
      return resolver;
    }

    const twice = (props?: AnyProps): unknown => {
      resolver(props);

      const answer = resolver(props);

      return typeof answer === "object" && answer !== null
        ? readSlotsTwice(answer as Record<string, AnySlotResolver>)
        : answer;
    };

    return Object.assign(twice, { config: resolver.config, variantKeys: resolver.variantKeys });
  };

  return define as TailwindVariantsFactory;
};
