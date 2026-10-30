/**
 * Encoding one call's variant selection as a key, so a resolver can answer a repeated selection
 * from a cache instead of walking the plan again.
 *
 * Each variant is one digit of a mixed-radix number. An axis no compound reads is keyed by the group
 * key, because two values sharing a key select the same classes. On an axis a compound reads, a
 * value the compounds compare against gets a digit of its own, since `true` and `"true"` share a
 * group key while comparing differently; every other value falls back to its group key.
 */

import { toVariantKey } from "#compile/class-values";
import type { CompoundCondition } from "#compile/compound";
import { listComparedValues } from "#compile/compound";
import type { VariantPlan } from "#compile/plan";

/**
 * The selection of a call this encoder cannot represent, and which therefore must not be cached.
 *
 * @since 0.6.0
 */
export const UNENCODABLE = -1;

/** Values a compound-tested axis remembers beyond those its group answers or its compounds name. */
const UNANSWERED_RAW_LIMIT = 32;

const AXIS_BY_GROUP_KEY = 0;
const AXIS_BY_RAW_VALUE = 1;

type AxisKind = typeof AXIS_BY_GROUP_KEY | typeof AXIS_BY_RAW_VALUE;

interface SelectionAxis {
  readonly group: Record<string, unknown>;
  readonly kind: AxisKind;
  /** Ids for the values the compounds compare against, from one; empty on a group-key axis. */
  readonly matchIds: Map<unknown, number>;
  readonly name: string;
  nextId: number;
  /** Which safe-integer part of the key this digit lands in. */
  readonly part: number;
  /** Ids already worked out on a raw-value axis, keyed by the value passed. */
  readonly rawIds: Map<unknown, number>;
  readonly stride: number;
  /** The id every value the group does not answer shares, and one past the last group id. */
  readonly unknownId: number;
  readonly valueIds: Record<string, number>;
}

/**
 * Encodes a call's selection, or reports it as unencodable.
 *
 * @since 0.6.0
 */
export interface SelectionEncoder {
  keyOf: (variantProps: Record<string, unknown>) => number | string;
}

const EMPTY_GROUP: Record<string, unknown> = {};
const EMPTY_IDS: Map<unknown, number> = new Map();

/**
 * Ids live on a null-prototype object: a variant value of `"toString"` would otherwise read
 * `Object.prototype.toString` back out of a plain one and be mistaken for an id already assigned.
 */
const createValueIds = (): Record<string, number> => Object.create(null) as Record<string, number>;

/**
 * The values each compound-tested name is compared against, keyed by name.
 *
 * @remarks A `Map` keys by SameValueZero, which tells apart every pair of values a condition does.
 */
const collectComparedValues = (plan: VariantPlan): Map<string, Map<unknown, number>> => {
  const comparedValues = new Map<string, Map<unknown, number>>();
  const addCondition = (condition: CompoundCondition): void => {
    let ids = comparedValues.get(condition.name);

    if (ids === undefined) {
      ids = new Map();
      comparedValues.set(condition.name, ids);
    }

    for (const value of listComparedValues(condition)) {
      if (!ids.has(value)) {
        ids.set(value, ids.size + 1);
      }
    }
  };

  for (const compound of plan.compounds) {
    compound.conditions.forEach(addCondition);
  }

  for (const compoundSlot of plan.compoundSlots) {
    compoundSlot.conditions.forEach(addCondition);
  }

  return comparedValues;
};

/**
 * Compile a plan's variants into an encoder.
 *
 * @remarks A selection space past one safe integer spans several, joined into a string key.
 *
 * @since 0.6.0
 */
export const compileSelectionEncoder = (plan: VariantPlan): SelectionEncoder => {
  const comparedValues = plan.conditionNames.length > 0 ? collectComparedValues(plan) : null;
  const axes: Array<SelectionAxis> = [];
  let part = 0;
  let states = 1;

  // Id zero always means "the call omitted this variant", so a radix leaves room for it.
  const addAxis = (name: string, group: Record<string, unknown>, valueCount: number): SelectionAxis => {
    const matchIds = comparedValues?.get(name);
    const kind = matchIds === undefined ? AXIS_BY_GROUP_KEY : AXIS_BY_RAW_VALUE;
    // A raw-value axis numbers its compared values first, then a group id for every other value.
    const unknownId = (matchIds === undefined ? 0 : matchIds.size) + valueCount + 1;
    const radix = unknownId + 1;

    if (states > Number.MAX_SAFE_INTEGER / radix) {
      part++;
      states = 1;
    }

    const axis: SelectionAxis = {
      group,
      kind,
      matchIds: matchIds ?? EMPTY_IDS,
      name,
      nextId: matchIds === undefined ? 1 : matchIds.size + 1,
      part,
      rawIds: kind === AXIS_BY_RAW_VALUE ? new Map() : EMPTY_IDS,
      stride: states,
      unknownId,
      valueIds: createValueIds(),
    };

    axes.push(axis);
    states *= radix;

    return axis;
  };

  for (const entry of plan.entries) {
    const axis = addAxis(entry.name, entry.source, entry.valueCount);
    const defaultKey = entry.defaultKey;

    // A call passing the default explicitly resolves as one omitting it, so both take id zero.
    if (axis.kind === AXIS_BY_GROUP_KEY) {
      axis.valueIds[defaultKey] = 0;
    } else {
      const defaultValue = entry.defaultValue;

      // A compound reads an omitted value as the configured default exactly as written, so only that value joins it.
      if (defaultValue !== undefined && typeof defaultValue !== "object" && typeof defaultValue !== "function") {
        axis.rawIds.set(defaultValue, 0);
      }
    }
  }

  if (comparedValues !== null) {
    const declaredNames = new Set(plan.entries.map((entry) => entry.name));

    // A compound may test a name no variant declares, and the call's value for it still decides.
    for (const name of plan.conditionNames) {
      if (!declaredNames.has(name)) {
        addAxis(name, EMPTY_GROUP, 0);
      }
    }
  }

  /** The id the group gives a value, handing one out on first sight. */
  const groupIdOf = (axis: SelectionAxis, selected: unknown): number => {
    const variantKey = toVariantKey(selected);

    if (variantKey === undefined) {
      return axis.unknownId;
    }

    const found = axis.valueIds[variantKey];

    if (found !== undefined) {
      return found;
    }

    if (!Object.hasOwn(axis.group, variantKey)) {
      // Not remembered: the ids table is only ever as large as the group, where remembering
      // every value a caller passes would grow it without bound for the resolver's lifetime.
      return axis.unknownId;
    }

    if (axis.nextId >= axis.unknownId) {
      // More answering keys than own keys were counted for the radix — an inherited one.
      return UNENCODABLE;
    }

    const id = axis.nextId++;

    axis.valueIds[variantKey] = id;

    return id;
  };

  /** The id of a value on a raw-value axis the first time it is seen. */
  const rawIdOf = (axis: SelectionAxis, selected: unknown): number => {
    // A compared value fixes its group key too, so its own id stands for both.
    const id = axis.matchIds.get(selected) ?? groupIdOf(axis, selected);
    const rawIds = axis.rawIds;

    // Only primitives are kept, and past a few only those the configuration names, so the map stays bounded.
    if (
      id !== UNENCODABLE &&
      (id !== axis.unknownId || rawIds.size < UNANSWERED_RAW_LIMIT) &&
      typeof selected !== "object" &&
      typeof selected !== "function"
    ) {
      rawIds.set(selected, id);
    }

    return id;
  };

  if (part > 0) {
    return {
      keyOf: (variantProps: Record<string, unknown>): string | number => {
        let text = "";
        let key = 0;
        let currentPart = 0;

        for (const axis of axes) {
          if (axis.part !== currentPart) {
            text = `${text}${String(key)}.`;
            key = 0;
            currentPart = axis.part;
          }

          const selected = variantProps[axis.name];

          if (selected === undefined) {
            continue;
          }

          const id =
            axis.kind === AXIS_BY_GROUP_KEY
              ? groupIdOf(axis, selected)
              : (axis.rawIds.get(selected) ?? rawIdOf(axis, selected));

          if (id === UNENCODABLE) {
            return UNENCODABLE;
          }

          key += id * axis.stride;
        }

        return text + String(key);
      },
    };
  }

  return {
    keyOf: (variantProps: Record<string, unknown>): number => {
      let key = 0;

      for (const axis of axes) {
        const selected = variantProps[axis.name];

        if (selected === undefined) {
          continue;
        }

        let id: number;

        if (axis.kind === AXIS_BY_GROUP_KEY) {
          const variantKey = toVariantKey(selected);

          if (variantKey === undefined) {
            id = axis.unknownId;
          } else {
            const found = axis.valueIds[variantKey];

            id = found === undefined ? groupIdOf(axis, selected) : found;
          }
        } else {
          const found = axis.rawIds.get(selected);

          id = found === undefined ? rawIdOf(axis, selected) : found;
        }

        if (id === UNENCODABLE) {
          return UNENCODABLE;
        }

        key += id * axis.stride;
      }

      return key;
    },
  };
};
