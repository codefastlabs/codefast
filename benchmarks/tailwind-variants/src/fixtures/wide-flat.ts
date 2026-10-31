/**
 * A component without slots with many variants, every one defaulted — the shape of a configurable table or form
 * control — rendered a couple of times.
 */

const VARIANT_COUNT = 24;
const TONES = ["slate", "sky", "rose"] as const;

/**
 * The wide configuration, built once so every side defines the same object.
 *
 * @since 0.11.1
 */
export const wideFlatVariants = (() => {
  const variants: Record<string, Record<string, string>> = {};
  const defaultVariants: Record<string, string> = {};

  for (let index = 0; index < VARIANT_COUNT; index++) {
    const name = `v${String(index)}`;
    const values: Record<string, string> = {};

    for (const tone of TONES) {
      values[tone] = `[--${name}:${tone}]`;
    }

    variants[name] = values;
    defaultVariants[name] = "slate";
  }

  return { base: "inline-flex items-center", defaultVariants, variants };
})();

/**
 * The selections a wide component renders, in order: its defaults, then two variants changed.
 *
 * @since 0.11.1
 */
export const wideFlatSelections: ReadonlyArray<Readonly<Record<string, string>>> = [{}, { v3: "sky", v17: "rose" }];
