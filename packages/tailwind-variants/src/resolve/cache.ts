/**
 * A bounded store for what a resolver already worked out, keyed by an encoded selection.
 *
 * Two generations rather than an LRU: eviction is one pointer move on overflow instead of
 * bookkeeping on every hit, and the older generation keeps a working set slightly over the limit
 * from thrashing.
 */

/** Weight one generation holds before it is retired: one per entry, plus what its entries hold inside. */
const GENERATION_LIMIT = 2048;

/**
 * A store whose values are never `undefined`, so a miss and a stored value stay distinguishable.
 *
 * @since 0.6.0
 */
export interface ResolutionCache<Value> {
  /** Counts one more thing stored inside an entry already held, so nested growth stays within the limit. */
  charge: () => void;
  get: (key: number | string) => Value | undefined;
  set: (key: number | string, value: Value) => void;
}

/**
 * Creates a cache for one resolver.
 *
 * @param nestedWeightOf - What an entry holds inside it, charged again when the entry is promoted out of the retired
 * generation; omitted, every entry weighs one.
 *
 * @since 0.6.0
 */
export const createResolutionCache = <Value>(nestedWeightOf?: (value: Value) => number): ResolutionCache<Value> => {
  let current = new Map<number | string, Value>();
  // Nothing is retired until a generation overflows, and most resolvers never get that far.
  let previous: Map<number | string, Value> | null = null;
  let charged = 0;

  const retireWhenFull = (): void => {
    if (current.size + charged > GENERATION_LIMIT) {
      previous = current;
      current = new Map();
      charged = 0;
    }
  };

  return {
    charge: (): void => {
      charged++;
      retireWhenFull();
    },
    get: (key: number | string): Value | undefined => {
      const hit = current.get(key);

      if (hit !== undefined || previous === null) {
        return hit;
      }

      const retired = previous.get(key);

      if (retired !== undefined) {
        // A promotion fills the current generation as a store does, or a re-read working set never retires.
        current.set(key, retired);

        if (nestedWeightOf !== undefined) {
          charged += nestedWeightOf(retired);
        }

        retireWhenFull();
      }

      return retired;
    },
    set: (key: number | string, value: Value): void => {
      current.set(key, value);
      retireWhenFull();
    },
  };
};
