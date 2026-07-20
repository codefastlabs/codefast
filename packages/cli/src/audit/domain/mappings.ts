/**
 * Physical → logical replacements. Order matters: negative before positive,
 * specific corners before general edges, with-value before bare.
 *
 * @since 1.0.0-canary.7
 */
export const RTL_MAPPINGS: ReadonlyArray<readonly [string, string]> = [
  ["-ml-", "-ms-"],
  ["-mr-", "-me-"],
  ["ml-", "ms-"],
  ["mr-", "me-"],
  ["pl-", "ps-"],
  ["pr-", "pe-"],
  ["-left-", "-start-"],
  ["-right-", "-end-"],
  ["left-", "start-"],
  ["right-", "end-"],
  ["inset-l-", "inset-inline-start-"],
  ["inset-r-", "inset-inline-end-"],
  ["rounded-tl-", "rounded-ss-"],
  ["rounded-tr-", "rounded-se-"],
  ["rounded-bl-", "rounded-es-"],
  ["rounded-br-", "rounded-ee-"],
  ["rounded-l-", "rounded-s-"],
  ["rounded-r-", "rounded-e-"],
  ["rounded-tl", "rounded-ss"],
  ["rounded-tr", "rounded-se"],
  ["rounded-bl", "rounded-es"],
  ["rounded-br", "rounded-ee"],
  ["rounded-l", "rounded-s"],
  ["rounded-r", "rounded-e"],
  ["border-l-", "border-s-"],
  ["border-r-", "border-e-"],
  ["border-l", "border-s"],
  ["border-r", "border-e"],
  ["text-left", "text-start"],
  ["text-right", "text-end"],
  ["scroll-ml-", "scroll-ms-"],
  ["scroll-mr-", "scroll-me-"],
  ["scroll-pl-", "scroll-ps-"],
  ["scroll-pr-", "scroll-pe-"],
  ["float-left", "float-start"],
  ["float-right", "float-end"],
  ["clear-left", "clear-start"],
  ["clear-right", "clear-end"],
  ["origin-top-left", "origin-top-start"],
  ["origin-top-right", "origin-top-end"],
  ["origin-bottom-left", "origin-bottom-start"],
  ["origin-bottom-right", "origin-bottom-end"],
  ["origin-left", "origin-start"],
  ["origin-right", "origin-end"],
];

/**
 * translate-x has no logical equivalent — it needs an rtl:-negated twin.
 *
 * @since 1.0.0-canary.7
 */
export const RTL_TRANSLATE_X_MAPPINGS: ReadonlyArray<readonly [string, string]> = [
  ["-translate-x-", "translate-x-"],
  ["translate-x-", "-translate-x-"],
];

/**
 * Classes that need an rtl:*-reverse companion.
 *
 * @since 1.0.0-canary.7
 */
export const RTL_REVERSE_MAPPINGS: ReadonlyArray<readonly [string, string]> = [
  ["space-x-", "space-x-reverse"],
  ["divide-x-", "divide-x-reverse"],
];

/**
 * Classes that need an rtl: companion with the swapped value.
 *
 * @since 1.0.0-canary.7
 */
export const RTL_SWAP_MAPPINGS: ReadonlyArray<readonly [string, string]> = [
  ["cursor-w-resize", "cursor-e-resize"],
  ["cursor-e-resize", "cursor-w-resize"],
];

/**
 * Anything anchored to a physical side variant stays physical: Radix resolves
 * `side` per direction, and a border/position/slide tied to that side must follow it.
 *
 * @since 1.0.0-canary.7
 */
export const PHYSICAL_SIDE_VARIANT =
  /data-side-(?:left|right)|data-\[side=(?:left|right)\]|\[data-side=(?:left|right)\]/;

/**
 * Slide animations under direction-resolved contexts are correct as-is:
 * Radix flips `side`/`motion` values itself under DirectionProvider.
 *
 * @since 1.0.0-canary.7
 */
export const DIRECTION_RESOLVED_VARIANT = /data-\[motion[=^]/;

/**
 * @since 1.0.0-canary.7
 */
export const SLIDE_PREFIXES = [
  "slide-in-from-left",
  "slide-in-from-right",
  "slide-out-to-left",
  "slide-out-to-right",
] as const;
