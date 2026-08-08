/**
 * A bounded store for what a resolver already worked out, keyed by an encoded selection.
 *
 * Two generations rather than an LRU: eviction is one pointer move on overflow instead of
 * bookkeeping on every hit, and the older generation keeps a working set slightly over the limit
 * from thrashing.
 */

/** Entries one generation holds before it is retired. */
const GENERATION_LIMIT = 128;

/**
 * A store whose values are never `undefined`, so a miss and a stored value stay distinguishable.
 */
export interface ResolutionCache<TValue> {
  get: (key: number | string) => TValue | undefined;
  set: (key: number | string, value: TValue) => void;
}

/**
 * Create a cache for one resolver.
 */
export const createResolutionCache = <TValue>(): ResolutionCache<TValue> => {
  let current = new Map<number | string, TValue>();
  // Nothing is retired until a generation overflows, and most resolvers never get that far.
  let previous: Map<number | string, TValue> | null = null;

  return {
    get: (key: number | string): TValue | undefined => {
      const hit = current.get(key);

      if (hit !== undefined || previous === null) {
        return hit;
      }

      const retired = previous.get(key);

      if (retired !== undefined) {
        current.set(key, retired);
      }

      return retired;
    },
    set: (key: number | string, value: TValue): void => {
      current.set(key, value);

      if (current.size > GENERATION_LIMIT) {
        previous = current;
        current = new Map();
      }
    },
  };
};
