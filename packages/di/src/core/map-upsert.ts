/** The two `Map` upsert forms the container indexes on, owned here so the package's Node floor stays put. */

/**
 * Returns the value stored under a key, inserting the given fallback first when the key is absent.
 *
 * @remarks The caller evaluates the fallback either way, so this form fits an insertion that usually
 * misses. Absence is one `get`, which is why the value type excludes `undefined`.
 *
 * @param map - mutated in place on a miss
 * @param key - looked up by the map's own key equality
 * @param value - stored and returned when the key is absent
 */
export function getOrInsert<Key, Value extends {} | null>(
  map: Map<Key, Value>,
  key: NoInfer<Key>,
  value: NoInfer<Value>,
): Value {
  const existing = map.get(key);
  if (existing !== undefined) {
    return existing;
  }
  map.set(key, value);
  return value;
}

/**
 * Returns the value stored under a key, computing and inserting a fallback only when the key is absent.
 *
 * @remarks Fits a lookup that usually hits, where an eager fallback would allocate per call; hoist
 * the factory to module scope and no closure is allocated either. Absence is decided as in
 * {@link getOrInsert}.
 *
 * @param map - mutated in place on a miss
 * @param key - looked up by the map's own key equality, and handed to the factory
 * @param create - called only on a miss
 */
export function getOrInsertComputed<Key, Value extends {} | null>(
  map: Map<Key, Value>,
  key: NoInfer<Key>,
  create: (key: NoInfer<Key>) => NoInfer<Value>,
): Value {
  const existing = map.get(key);
  if (existing !== undefined) {
    return existing;
  }
  const created = create(key);
  map.set(key, created);
  return created;
}
