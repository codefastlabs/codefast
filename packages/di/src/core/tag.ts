/** Tag keys and the interned pairs they mint — the one way a slot criterion is built. */

declare const TAG_KEY_BRAND: unique symbol;
declare const BINDING_TAG_BRAND: unique symbol;

/**
 * How many distinct tag keys one mask bit is shared by.
 *
 * @remarks Ids past this wrap, so two keys can share a bit. The mask is a prefilter only — a shared
 * bit costs a false positive that the identity comparison then rejects, never a false negative.
 */
const MASK_WIDTH = 32;

/**
 * A slot's or a request's tag key set, as one word.
 *
 * @remarks A slot matches only if the request carries every key the slot declares, which is
 * `(requestMask & slotMask) === slotMask` — the whole subset test, before any value is read. Keys
 * are prefiltered rather than values indexed because a key set fits in a word and a value set does not.
 *
 * @since 0.6.0
 */
export type TagKeyMask = number & { readonly [TAG_KEY_BRAND]: "mask" };

/**
 * The empty key set: what an untagged slot and an untagged request both carry.
 *
 * @since 0.6.0
 */
export const NO_TAG_KEYS = 0 as TagKeyMask;

/**
 * One `[key, value]` criterion, interned so equal criteria are the same object.
 *
 * @remarks Only {@link TagKey.of} mints one, which is what makes identity a sound stand-in for the
 * `Object.is` comparison the slot contract requires. Never build one by hand — the matcher and the
 * registry index both read identity, so a hand-built criterion matches nothing.
 *
 * @since 0.6.0
 */
export interface BindingTag<Value = unknown> {
  readonly key: TagKey<Value>;
  readonly value: Value;
  /** This pair's key mask, copied off the key so the matcher reads one field. */
  readonly mask: TagKeyMask;
  readonly [BINDING_TAG_BRAND]: true;
}

/**
 * A named tag key, and the factory for its criteria.
 *
 * @since 0.6.0
 */
export interface TagKey<Value = unknown> {
  readonly name: string;
  /** Process-monotonic, so a key set is a mask and the registry can index on a number. */
  readonly id: number;
  readonly mask: TagKeyMask;
  /** The criterion for one value, interned: the same value always yields the same object. */
  of(value: Value): BindingTag<Value>;
}

let tagKeyCounter = -1;

/**
 * Distinguishes `-0` from `+0` in the intern cache.
 *
 * @remarks A `Map` key compares by SameValueZero, which holds `+0` and `-0` equal, while tag values
 * compare by `Object.is`, which does not. Interning them to one object would make the
 * two indistinguishable everywhere downstream, so the negative one is cached under this instead.
 */
const NEGATIVE_ZERO_KEY: unique symbol = Symbol("di:tag-negative-zero");

function internKeyFor(value: unknown): unknown {
  return value === 0 && Object.is(value, -0) ? NEGATIVE_ZERO_KEY : value;
}

/**
 * Declares a tag key, whose `of()` builds the criteria a `whenTagged` and a resolve both take.
 *
 * @remarks The value type is checked at both ends: a key declared `tag<Region>("region")` refuses a
 * value that is not a `Region`, so a bind site and a resolve site cannot drift apart silently.
 *
 * @example
 * ```ts
 * const Region = tag<"eu" | "us">("region");
 * container.bind(Storage).to(S3).whenTagged(Region.of("eu"));
 * container.resolve(Storage, { tag: Region.of("eu") });
 * ```
 *
 * @since 0.6.0
 */
export function tag<Value = unknown>(name: string): TagKey<Value> {
  tagKeyCounter += 1;
  const id = tagKeyCounter;
  const mask = (1 << (id % MASK_WIDTH)) as TagKeyMask;
  const interned = new Map<unknown, BindingTag<Value>>();

  const key: TagKey<Value> = {
    name,
    id,
    mask,
    of(value: Value): BindingTag<Value> {
      const cacheKey = internKeyFor(value);
      const existing = interned.get(cacheKey);

      if (existing !== undefined) {
        return existing;
      }

      const pair = { key, value, mask } as BindingTag<Value>;

      interned.set(cacheKey, pair);

      return pair;
    },
  };

  return key;
}

/**
 * The key set a list of criteria covers.
 *
 * @since 0.6.0
 */
export function tagKeyMaskOf(tags: ReadonlyArray<BindingTag>): TagKeyMask {
  let mask = NO_TAG_KEYS;

  for (let index = 0; index < tags.length; index += 1) {
    mask = (mask | tags[index]!.mask) as TagKeyMask;
  }

  return mask;
}

/**
 * Whether a request carrying `requestMask` covers every key in `slotMask`.
 *
 * @since 0.6.0
 */
export function coversTagKeys(requestMask: TagKeyMask, slotMask: TagKeyMask): boolean {
  return (requestMask & slotMask) === slotMask;
}
