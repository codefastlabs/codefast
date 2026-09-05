/**
 * The cold lane: one resolution read straight from the configuration, before a plan exists.
 */

import { hasBooleanVariantValues, isSlotClassMap, toClassText, toVariantKey } from "#/compile/class-values";
import { getCompoundClass } from "#/compile/compound";
import type {
  ClassValue,
  SlotClassResolver,
  SlotResolverProps,
  SlotSchema,
  SlotVariantConfig,
  VariantConfig,
  VariantSchema,
} from "#/types";

type Definition = SlotVariantConfig<VariantSchema, SlotSchema> | VariantConfig<VariantSchema>;
type Props = Record<string, unknown>;

const EMPTY_DEFAULTS: Props = {};

const append = (text: string, classes: string): string => {
  if (classes === "") {
    return text;
  }

  return text === "" ? classes : `${text} ${classes}`;
};

/**
 * The group key these props select for one variant, or `undefined` for none.
 *
 * @remarks Mirrors the plan: a missing selection takes the configured default, or `false` for a
 * boolean group, and the slot lane alone treats a falsy key as no selection.
 */
const selectedKey = (
  group: Record<string, unknown>,
  configuredDefault: unknown,
  selected: unknown,
  slotLane: boolean,
): unknown => {
  if (selected === undefined) {
    if (configuredDefault === undefined) {
      return hasBooleanVariantValues(group) ? "false" : undefined;
    }

    return toVariantKey(configuredDefault);
  }

  const key = toVariantKey(selected);

  return slotLane && !key ? undefined : key;
};

/** The own value a group holds under a key a caller chose, guarding against inherited members. */
const ownValue = (group: Record<string, unknown>, key: unknown): unknown => {
  return Object.hasOwn(group, key as PropertyKey) ? group[key as string] : undefined;
};

/**
 * Whether every condition of a raw compound definition holds, reading slot props first, then
 * variant props, then the configured default.
 */
const matchesColdCompound = (
  definition: Props,
  props: Props,
  defaults: Props,
  slotProps: Props | null,
  coerceMissingBoolean: boolean,
  skipSlots: boolean,
): boolean => {
  for (const name of Object.keys(definition)) {
    if (name === "class" || name === "className" || (skipSlots && name === "slots")) {
      continue;
    }

    const expected = definition[name];
    let value = slotProps === null ? undefined : slotProps[name];

    if (value === undefined) {
      value = props[name];
    }

    if (value === undefined) {
      value = defaults[name];
    }

    if (Array.isArray(expected)) {
      if (!expected.includes(value)) {
        return false;
      }
    } else if (typeof expected === "boolean" && coerceMissingBoolean) {
      if ((value === undefined ? false : value) !== expected) {
        return false;
      }
    } else if (value !== expected) {
      return false;
    }
  }

  return true;
};

const finish = (text: string, shouldMerge: boolean, tailwindMerge: (classes: string) => string): string | undefined => {
  if (text === "") {
    return undefined;
  }

  return shouldMerge ? tailwindMerge(text) : text;
};

/**
 * Resolves a configuration without slots for one set of props, reading the configuration directly.
 */
export const resolveColdVariantClasses = (
  configuration: Definition,
  shouldMerge: boolean,
  tailwindMerge: (classes: string) => string,
  props: Props,
): string | undefined => {
  const variants = configuration.variants;
  const defaults = (configuration.defaultVariants ?? EMPTY_DEFAULTS) as Props;
  let text = toClassText(configuration.base);

  if (variants !== undefined) {
    for (const name of Object.keys(variants)) {
      const group = variants[name];

      if (group === undefined) {
        continue;
      }

      const key = selectedKey(group, defaults[name], props[name], false);

      if (key !== undefined) {
        text = append(text, toClassText(ownValue(group, key) as ClassValue));
      }
    }
  }

  const compounds = configuration.compoundVariants;

  if (compounds !== undefined) {
    for (const compound of compounds) {
      if (matchesColdCompound(compound as Props, props, defaults, null, true, false)) {
        text = append(text, toClassText(getCompoundClass(compound)));
      }
    }
  }

  const className = props.className as ClassValue;
  const customClasses = className === undefined || className === null ? (props.class as ClassValue) : className;

  if (customClasses) {
    text = append(text, toClassText(customClasses));
  }

  return finish(text, shouldMerge, tailwindMerge);
};

/** What one configured class value contributes to a slot: its map entry, or all of it to `base`. */
const slotContribution = (value: unknown, slotName: string): string => {
  if (isSlotClassMap(value as ClassValue)) {
    const slotClassMap = value as Record<string, ClassValue>;

    return Object.hasOwn(slotClassMap, slotName) ? toClassText(slotClassMap[slotName]) : "";
  }

  return slotName === "base" ? toClassText(value as ClassValue) : "";
};

const coldSlotText = (
  configuration: SlotVariantConfig<VariantSchema, SlotSchema>,
  defaults: Props,
  props: Props,
  slotName: string,
  overrides: Props | null,
): string => {
  const slots = configuration.slots ?? {};
  let text = toClassText(
    slotName === "base" ? (slots.base === undefined ? configuration.base : slots.base) : slots[slotName],
  );
  const variants = configuration.variants;

  if (variants !== undefined) {
    for (const name of Object.keys(variants)) {
      const group = variants[name];

      if (group === undefined) {
        continue;
      }

      let key: unknown;

      if (overrides !== null && overrides[name] !== undefined) {
        const overrideKey = toVariantKey(overrides[name]);

        key = overrideKey ? overrideKey : undefined;
      } else {
        key = selectedKey(group, defaults[name], props[name], true);
      }

      if (key !== undefined) {
        text = append(text, slotContribution(ownValue(group, key), slotName));
      }
    }
  }

  const compounds = configuration.compoundVariants;

  if (compounds !== undefined) {
    for (const compound of compounds) {
      if (matchesColdCompound(compound as Props, props, defaults, overrides, false, false)) {
        text = append(text, slotContribution(getCompoundClass(compound), slotName));
      }
    }
  }

  const compoundSlots = configuration.compoundSlots;

  if (compoundSlots !== undefined) {
    for (const compoundSlot of compoundSlots) {
      // Compound slots read the call's props only, never a slot's own overrides.
      if (!matchesColdCompound(compoundSlot as unknown as Props, props, defaults, null, true, true)) {
        continue;
      }

      const classes = toClassText(getCompoundClass(compoundSlot));

      for (const target of compoundSlot.slots as ReadonlyArray<string>) {
        if (target === slotName) {
          text = append(text, classes);
        }
      }
    }
  }

  return text;
};

/**
 * Creates one class resolver per slot for one set of props, reading the configuration directly.
 */
export const createColdSlotResolvers = (
  configuration: SlotVariantConfig<VariantSchema, SlotSchema>,
  shouldMerge: boolean,
  tailwindMerge: (classes: string) => string,
  props: Props,
): Record<string, SlotClassResolver<VariantSchema>> => {
  const defaults = (configuration.defaultVariants ?? EMPTY_DEFAULTS) as Props;
  const resolvers: Record<string, SlotClassResolver<VariantSchema>> = {};
  const names = ["base"];

  for (const name of Object.keys(configuration.slots ?? {})) {
    if (name !== "base") {
      names.push(name);
    }
  }

  for (const slotName of names) {
    let resolved = false;
    let memoised: string | undefined;

    resolvers[slotName] = (slotProps?: SlotResolverProps<VariantSchema>): string | undefined => {
      if (slotProps === undefined) {
        if (!resolved) {
          memoised = finish(coldSlotText(configuration, defaults, props, slotName, null), shouldMerge, tailwindMerge);
          resolved = true;
        }

        return memoised;
      }

      const overrides = slotProps as Props;
      let text = coldSlotText(configuration, defaults, props, slotName, overrides);

      text = append(text, toClassText(overrides.className as ClassValue));
      text = append(text, toClassText(overrides.class as ClassValue));

      return finish(text, shouldMerge, tailwindMerge);
    };
  }

  return resolvers;
};
