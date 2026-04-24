import type { Binding, ResolveHint } from "#/binding";

/**
 * Stable identity for tag values that cannot be JSON-serialized (circular refs, etc.).
 * Referential identity distinguishes otherwise indistinguishable `String(value)` fallbacks.
 */
const lastWinsTagObjectIds = new WeakMap<object, number>();
let lastWinsTagObjectIdSeq = 1;

function allocateLastWinsTagObjectId(value: object): number {
  let id = lastWinsTagObjectIds.get(value);
  if (id === undefined) {
    id = lastWinsTagObjectIdSeq++;
    lastWinsTagObjectIds.set(value, id);
  }
  return id;
}

/**
 * Derives a {@link ResolveHint} from a binding's name or first tag.
 * Used by {@link DefaultContainer.initializeAsync} to re-resolve named/tagged singletons
 * through the standard resolution path.
 */
export function resolveHintForBinding(binding: Binding<unknown>): ResolveHint | undefined {
  if (binding.bindingName !== undefined) {
    return { name: binding.bindingName };
  }
  for (const [tagKey, tagValue] of binding.tags) {
    return { tag: [tagKey, tagValue] as const };
  }
  return undefined;
}

export function buildLastWinsSlotKey(binding: Binding<unknown>): string | undefined {
  if (binding.constraint !== undefined) {
    return undefined;
  }
  if (binding.bindingName === undefined && binding.tags.size === 0) {
    return "default";
  }
  if (binding.tags.size === 0) {
    return `name=${binding.bindingName}`;
  }
  const toStableTagValue = (value: unknown): string => {
    if (typeof value === "bigint") {
      return `bigint:${value.toString()}n`;
    }
    try {
      const serialized = JSON.stringify(value);
      return serialized ?? String(value);
    } catch {
      if (typeof value === "object" && value !== null) {
        return `non-json:object#${String(allocateLastWinsTagObjectId(value))}`;
      }
      return String(value);
    }
  };
  const normalizedTagEntries = [...binding.tags.entries()]
    .sort(([leftTag], [rightTag]) => leftTag.localeCompare(rightTag))
    .map(([tagKey, tagValue]) => [tagKey, toStableTagValue(tagValue)] as const);
  const tagsKey = normalizedTagEntries
    .map(([tagKey, tagValue]) => `${tagKey}:${tagValue}`)
    .join("|");
  const nameKey = binding.bindingName ?? "";
  return `name=${nameKey};tags=${tagsKey}`;
}
