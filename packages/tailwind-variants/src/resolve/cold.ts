/**
 * The cold lane: one resolution read straight from the configuration, before a plan exists.
 */

import { isSlotClassMap, pickClassProp, toClassText, toDefaultKey, toVariantKey } from "#compile/class-values";
import { matchesCompoundValue } from "#compile/compound";
import type {
  ClassMerger,
  ClassValue,
  SlotClassResolver,
  SlotSchema,
  SlotVariantConfig,
  VariantConfig,
  VariantSchema,
  VariantSelection,
} from "#types";

type Definition = SlotVariantConfig<VariantSchema, SlotSchema> | VariantConfig<VariantSchema>;
type Props = Record<string, unknown>;

const EMPTY_DEFAULTS: Props = {};

const append = (text: string, classes: string): string => {
  if (classes === "") {
    return text;
  }

  return text === "" ? classes : `${text} ${classes}`;
};

/** The group key these props select for one variant, or `undefined` for none; a missing selection takes the default. */
const selectedKey = (configuredDefault: unknown, selected: unknown): string | undefined => {
  return selected === undefined ? toDefaultKey(configuredDefault) : toVariantKey(selected);
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
  skipSlots: boolean,
): boolean => {
  for (const name of Object.keys(definition)) {
    if (name === "class" || name === "className" || (skipSlots && name === "slots")) {
      continue;
    }

    let value = slotProps === null ? undefined : slotProps[name];

    if (value === undefined) {
      value = props[name];
    }

    if (value === undefined) {
      value = defaults[name];
    }

    if (!matchesCompoundValue(definition[name], value)) {
      return false;
    }
  }

  return true;
};

const finish = (text: string, mergeClasses: ClassMerger | null): string => {
  if (text === "") {
    return text;
  }

  return mergeClasses === null ? text : mergeClasses(text);
};

/**
 * Resolves a configuration without slots for one set of props, reading the configuration directly.
 *
 * @since 0.8.0
 */
export const resolveColdVariantClasses = (
  configuration: Definition,
  mergeClasses: ClassMerger | null,
  props: Props,
): string => {
  const variants = configuration.variants;
  const defaults = configuration.defaultVariants ?? EMPTY_DEFAULTS;
  let text = toClassText(configuration.base);

  if (variants !== undefined) {
    for (const name of Object.keys(variants)) {
      const group = variants[name];

      if (group === undefined) {
        continue;
      }

      const key = selectedKey(defaults[name], props[name]);

      if (key !== undefined) {
        text = append(text, toClassText(ownValue(group, key) as ClassValue));
      }
    }
  }

  const compounds = configuration.compoundVariants;

  if (compounds !== undefined) {
    for (const compound of compounds) {
      if (matchesColdCompound(compound, props, defaults, null, false)) {
        text = append(text, toClassText(pickClassProp(compound)));
      }
    }
  }

  const customClasses = pickClassProp(props);

  if (customClasses) {
    text = append(text, toClassText(customClasses));
  }

  return finish(text, mergeClasses);
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

      const override = overrides === null ? undefined : overrides[name];
      // A slot prop left null or undefined keeps the call's selection.
      const key =
        override === undefined || override === null ? selectedKey(defaults[name], props[name]) : toVariantKey(override);

      if (key !== undefined) {
        text = append(text, slotContribution(ownValue(group, key), slotName));
      }
    }
  }

  const compounds = configuration.compoundVariants;

  if (compounds !== undefined) {
    for (const compound of compounds) {
      if (matchesColdCompound(compound, props, defaults, overrides, false)) {
        text = append(text, slotContribution(pickClassProp(compound), slotName));
      }
    }
  }

  const compoundSlots = configuration.compoundSlots;

  if (compoundSlots !== undefined) {
    for (const compoundSlot of compoundSlots) {
      if (!matchesColdCompound(compoundSlot, props, defaults, overrides, true)) {
        continue;
      }

      const classes = toClassText(pickClassProp(compoundSlot));

      for (const target of compoundSlot.slots) {
        if (target === slotName) {
          text = append(text, classes);
        }
      }
    }
  }

  return text;
};

/**
 * The props a slot reads, copied when the resolver is called, without the classes and `children` no slot reads.
 *
 * @remarks A slot is called later than its resolver, and the caller's props object may have changed
 * by then or carry `children`, so the slots read this copy instead of holding it.
 */
const snapshotProps = (props: Props): Props => {
  const snapshot: Props = {};

  for (const name in props) {
    // Assigning `__proto__` would replace the copy's prototype rather than add a key.
    if (name !== "children" && name !== "class" && name !== "className" && name !== "__proto__") {
      snapshot[name] = props[name];
    }
  }

  return snapshot;
};

/**
 * Creates one class resolver per slot for one set of props, reading the configuration directly.
 *
 * @since 0.8.0
 */
export const createColdSlotResolvers = (
  configuration: SlotVariantConfig<VariantSchema, SlotSchema>,
  mergeClasses: ClassMerger | null,
  callProps: Props,
): Record<string, SlotClassResolver<VariantSchema>> => {
  const defaults = configuration.defaultVariants ?? EMPTY_DEFAULTS;
  const props = snapshotProps(callProps);
  const resolvers: Record<string, SlotClassResolver<VariantSchema>> = {};
  const names = ["base"];

  for (const name of Object.keys(configuration.slots ?? {})) {
    if (name !== "base") {
      names.push(name);
    }
  }

  for (const slotName of names) {
    let resolved = false;
    let memoised = "";

    // Null is what a JavaScript caller passes for no props.
    resolvers[slotName] = (slotProps?: VariantSelection<VariantSchema> | null): string => {
      if (slotProps === undefined || slotProps === null) {
        if (!resolved) {
          memoised = finish(coldSlotText(configuration, defaults, props, slotName, null), mergeClasses);
          resolved = true;
        }

        return memoised;
      }

      const overrides = slotProps as Props;
      let text = coldSlotText(configuration, defaults, props, slotName, overrides);

      text = append(text, toClassText(pickClassProp(overrides)));

      return finish(text, mergeClasses);
    };
  }

  return resolvers;
};
