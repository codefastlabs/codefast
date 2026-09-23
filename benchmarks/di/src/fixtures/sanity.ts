/**
 * The semantic checks every head-to-head row asserts, written once so no side can quietly measure a
 * cheaper meaning of the same feature.
 */

/**
 * Whether a transient resolve hands out a fresh instance every time, its dependency included.
 *
 * @remarks `resolve` resolves the transient root once; `dependencyOf` reads the root's transient
 * dependency, which must be fresh too.
 *
 * @since 0.8.0
 */
export function isFreshEachResolve<Value extends object>(
  resolve: () => Value,
  dependencyOf?: (value: Value) => object,
): boolean {
  const first = resolve();
  const second = resolve();
  if (first === second) {
    return false;
  }
  return dependencyOf === undefined || dependencyOf(first) !== dependencyOf(second);
}

/**
 * Whether a binding is one instance within a scope and a fresh one in the next scope.
 *
 * @remarks `resolveTwiceInFreshScope` opens a new scope — a child for a scoped binding, a fresh container for a
 * per-container singleton — and resolves the binding twice inside it.
 *
 * @since 0.8.0
 */
export function isSharedWithinScopeFreshAcross<Value extends object>(
  resolveTwiceInFreshScope: () => readonly [Value, Value],
): boolean {
  const [firstA, secondA] = resolveTwiceInFreshScope();
  const [firstB, secondB] = resolveTwiceInFreshScope();
  return firstA === secondA && firstB === secondB && firstA !== firstB;
}

/**
 * Whether a collection read holds every binding of a set bound as the indices `0 … count - 1`, once each.
 *
 * @remarks Order is not asserted: no library documents it, and a row must not fail on a contract it
 * never claimed.
 *
 * @since 0.8.0
 */
export function isCompleteCollection(values: ReadonlyArray<number>, count: number): boolean {
  if (values.length !== count) {
    return false;
  }
  const seen = new Set(values);
  if (seen.size !== count) {
    return false;
  }
  for (let index = 0; index < count; index++) {
    if (!seen.has(index)) {
      return false;
    }
  }
  return true;
}

/**
 * Whether a module composes every binding it declares: each index resolves, constants are shared, singletons are per container.
 *
 * @remarks `composeResolver` builds a fresh container from the module and returns a resolver by index; the
 * indices below `singletonFrom` are constants, the rest singleton factories.
 */
export function isComposedModule(
  composeResolver: () => (index: number) => { readonly id: number },
  count: number,
  singletonFrom: number,
): boolean {
  const first = composeResolver();
  const second = composeResolver();
  for (let index = 0; index < count; index++) {
    const value = first(index);
    if (value.id !== index || first(index) !== value) {
      return false;
    }
    if ((second(index) === value) !== index < singletonFrom) {
      return false;
    }
  }
  return true;
}
