/**
 * Encoding one call's variant selection as a single number, so a resolver can answer a repeated
 * selection from a cache instead of walking the plan again.
 *
 * Each variant is one axis of a mixed-radix number. An axis no compound reads is keyed by the group
 * key, because two values sharing a key select the same classes. An axis a compound reads is keyed
 * by the raw value instead: a compound compares against what the caller passed, and `true` and
 * `"true"` share a group key while comparing differently.
 */

import { toVariantKey } from "#/compile/class-values";
import type { VariantPlan } from "#/compile/plan";

/**
 * The selection of a call this encoder cannot represent, and which therefore must not be cached.
 *
 * @since 0.6.0
 */
export const UNENCODABLE = -1;

/** Distinct raw values one axis admits before it stops encoding calls. */
const RAW_AXIS_CAPACITY = 16;

const AXIS_BY_GROUP_KEY = 0;
const AXIS_BY_RAW_VALUE = 1;

type AxisKind = typeof AXIS_BY_GROUP_KEY | typeof AXIS_BY_RAW_VALUE;

interface SelectionAxis {
  readonly group: Record<string, unknown>;
  readonly kind: AxisKind;
  readonly name: string;
  nextId: number;
  readonly rawIds: Map<unknown, number>;
  readonly stride: number;
  readonly unknownId: number;
  readonly valueIds: Record<string, number>;
}

/**
 * Encodes a call's selection, or reports it as unencodable.
 *
 * @since 0.6.0
 */
export interface SelectionEncoder {
  keyOf: (variantProps: Record<string, unknown>) => number;
}

const EMPTY_GROUP: Record<string, unknown> = {};
const EMPTY_NAMES: ReadonlySet<string> = new Set();
const EMPTY_RAW_IDS: Map<unknown, number> = new Map();

/**
 * Ids live on a null-prototype object: a variant value of `"toString"` would otherwise read
 * `Object.prototype.toString` back out of a plain one and be mistaken for an id already assigned.
 */
const createValueIds = (): Record<string, number> => Object.create(null) as Record<string, number>;

const EMPTY_VALUE_IDS: Record<string, number> = createValueIds();

/**
 * Compile a plan's variants into an encoder, or `null` when the selection space is too large to
 * address with one safe integer.
 *
 * @remarks `treatFalsyKeyAsUnknown` mirrors the lane the encoder serves: the slot lane rejects a
 * falsy variant key where the flat lane looks it up.
 *
 * @since 0.6.0
 */
export const compileSelectionEncoder = (
  plan: VariantPlan,
  treatFalsyKeyAsUnknown: boolean,
): SelectionEncoder | null => {
  const hasConditions = plan.conditionNames.length > 0;
  const conditionNames = hasConditions ? new Set(plan.conditionNames) : EMPTY_NAMES;
  const axes: Array<SelectionAxis> = [];
  let states = 1;

  // Id zero always means "the call omitted this variant", so a radix leaves room for it.
  const addAxis = (
    name: string,
    kind: AxisKind,
    idCount: number,
    group: Record<string, unknown>,
  ): SelectionAxis | null => {
    const radix = idCount + 1;

    if (states > Number.MAX_SAFE_INTEGER / radix) {
      return null;
    }

    const byRawValue = kind === AXIS_BY_RAW_VALUE;
    const axis: SelectionAxis = {
      group,
      kind,
      name,
      nextId: 1,
      rawIds: byRawValue ? new Map() : EMPTY_RAW_IDS,
      stride: states,
      unknownId: idCount,
      valueIds: byRawValue ? EMPTY_VALUE_IDS : createValueIds(),
    };

    axes.push(axis);
    states *= radix;

    return axis;
  };

  for (const entry of plan.entries) {
    if (hasConditions && conditionNames.has(entry.name)) {
      if (addAxis(entry.name, AXIS_BY_RAW_VALUE, RAW_AXIS_CAPACITY, EMPTY_GROUP) === null) {
        return null;
      }

      continue;
    }

    // Ids are handed out as values turn up, so a group nobody selects from costs nothing to compile.
    if (addAxis(entry.name, AXIS_BY_GROUP_KEY, entry.valueCount + 1, entry.group) === null) {
      return null;
    }
  }

  if (hasConditions) {
    const declaredNames = new Set(plan.entries.map((entry) => entry.name));

    // A compound may test a name no variant declares, and the call's value for it still decides.
    for (const name of conditionNames) {
      if (!declaredNames.has(name) && addAxis(name, AXIS_BY_RAW_VALUE, RAW_AXIS_CAPACITY, EMPTY_GROUP) === null) {
        return null;
      }
    }
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

          if (variantKey === undefined || (treatFalsyKeyAsUnknown && !variantKey)) {
            id = axis.unknownId;
          } else {
            const found = axis.valueIds[variantKey];

            if (found !== undefined) {
              id = found;
            } else if (!Object.hasOwn(axis.group, variantKey)) {
              // Not remembered: the ids table is only ever as large as the group, where remembering
              // every value a caller passes would grow it without bound for the resolver's lifetime.
              id = axis.unknownId;
            } else if (axis.nextId < axis.unknownId) {
              id = axis.nextId++;
              axis.valueIds[variantKey] = id;
            } else {
              // More answering keys than own keys were counted for the radix — an inherited one.
              return UNENCODABLE;
            }
          }
        } else {
          const found = axis.rawIds.get(selected);

          if (found === undefined) {
            if (axis.rawIds.size >= RAW_AXIS_CAPACITY) {
              return UNENCODABLE;
            }

            id = axis.rawIds.size + 1;
            axis.rawIds.set(selected, id);
          } else {
            id = found;
          }
        }

        key += id * axis.stride;
      }

      return key;
    },
  };
};
