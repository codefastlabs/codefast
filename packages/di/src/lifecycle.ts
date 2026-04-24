import type { Binding, Constructor, ResolutionContext } from "#/binding";
import {
  CODEFAST_DI_LIFECYCLE_METADATA,
  decoratorMetadataObjectSymbol,
} from "#/metadata/metadata-keys";
import type { LifecycleMetadata } from "#/metadata/metadata-types";
import { AsyncResolutionError } from "#/errors";

/**
 * Duck-typed Promise check: returns `true` when `value` has a `then` method.
 * Used throughout the lifecycle layer to guard against async return values on sync resolution paths.
 */
export function isPromiseLike(value: unknown): value is Promise<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof (value as Promise<unknown>).then === "function"
  );
}

/**
 * Runs `onActivation` synchronously on a newly constructed instance.
 * If the handler returns a Promise during synchronous resolution, throws
 * {@link AsyncResolutionError} — callers must use `resolveAsync` for async activation handlers.
 *
 * Lifecycle ordering: `construct` → `@postConstruct` → **`onActivation`** → cache.
 */
export function runActivation(
  binding: Binding<unknown>,
  instance: unknown,
  ctx: ResolutionContext,
  pathLabels: readonly string[],
): unknown {
  const handler = binding.onActivation;
  if (handler === undefined) {
    return instance;
  }
  const bindingLabel = pathLabels[pathLabels.length - 1] ?? "(unknown)";
  const activationResult = handler(ctx, instance);
  if (isPromiseLike(activationResult)) {
    throw new AsyncResolutionError(
      bindingLabel,
      pathLabels,
      "onActivation returned a Promise during synchronous resolution",
    );
  }
  return activationResult;
}

/**
 * Reads lifecycle metadata ({@link LifecycleMetadata}) directly from a constructor's
 * `Symbol.metadata` object. Bypasses the {@link MetadataReader} abstraction —
 * used by the scope manager during deactivation when the reader is not available.
 */
export function readLifecycleMetadataFromCtor(
  implementationClass: Constructor<unknown>,
): LifecycleMetadata | undefined {
  const metadataSymbol = decoratorMetadataObjectSymbol();
  const metadataObject = (implementationClass as unknown as Record<symbol, unknown>)[
    metadataSymbol
  ];
  if (typeof metadataObject !== "object" || metadataObject === null) {
    return undefined;
  }
  const raw = (metadataObject as Record<PropertyKey, unknown>)[CODEFAST_DI_LIFECYCLE_METADATA];
  return typeof raw === "object" && raw !== null ? (raw as LifecycleMetadata) : undefined;
}

/**
 * Runs the `@postConstruct()` method synchronously if present.
 * Throws {@link AsyncResolutionError} if the method returns a Promise — async lifecycle
 * methods require `resolveAsync`.
 *
 * Lifecycle ordering: `construct` → **`@postConstruct`** → `onActivation` → cache.
 */
export function runPostConstruct(
  implementationClass: Constructor<unknown>,
  instance: unknown,
  pathLabels?: string[],
): void {
  const meta = readLifecycleMetadataFromCtor(implementationClass);
  if (meta?.postConstruct === undefined) {
    return;
  }
  const methodName = meta.postConstruct;
  const lifecycleMethod = (instance as Record<string, unknown>)[methodName];
  if (typeof lifecycleMethod !== "function") {
    return;
  }
  const postConstructResult = (lifecycleMethod as () => unknown).call(instance);
  if (isPromiseLike(postConstructResult)) {
    const labels = pathLabels ?? [];
    const bindingLabel = labels[labels.length - 1] ?? "(unknown)";
    throw new AsyncResolutionError(
      bindingLabel,
      labels,
      `@postConstruct() "${methodName}" returned a Promise during synchronous resolution`,
    );
  }
}

/**
 * Runs the `@postConstruct()` method, awaiting if it returns a Promise.
 */
export async function runPostConstructAsync(
  implementationClass: Constructor<unknown>,
  instance: unknown,
): Promise<void> {
  const meta = readLifecycleMetadataFromCtor(implementationClass);
  if (meta?.postConstruct === undefined) {
    return;
  }
  const methodName = meta.postConstruct;
  const lifecycleMethod = (instance as Record<string, unknown>)[methodName];
  if (typeof lifecycleMethod !== "function") {
    return;
  }
  await (lifecycleMethod as () => unknown).call(instance);
}

/**
 * Runs the `@preDestroy()` method synchronously if present.
 * Throws if the method returns a Promise — use `disposeAsync()` / `unloadAsync()` for async teardown.
 *
 * Lifecycle ordering: `onDeactivation` → **`@preDestroy`**.
 */
export function runPreDestroy(implementationClass: Constructor<unknown>, instance: unknown): void {
  const meta = readLifecycleMetadataFromCtor(implementationClass);
  if (meta?.preDestroy === undefined) {
    return;
  }
  const methodName = meta.preDestroy;
  const lifecycleMethod = (instance as Record<string, unknown>)[methodName];
  if (typeof lifecycleMethod !== "function") {
    return;
  }
  const preDestroyResult = (lifecycleMethod as () => unknown).call(instance);
  if (isPromiseLike(preDestroyResult)) {
    throw new Error(
      `@preDestroy() "${methodName}" returned a Promise during synchronous disposal; use disposeAsync() / unloadAsync().`,
    );
  }
}

/**
 * Runs the `@preDestroy()` method, awaiting if it returns a Promise.
 *
 * Lifecycle ordering: `onDeactivation` → **`@preDestroy`** (async variant).
 */
export async function runPreDestroyAsync(
  implementationClass: Constructor<unknown>,
  instance: unknown,
): Promise<void> {
  const meta = readLifecycleMetadataFromCtor(implementationClass);
  if (meta?.preDestroy === undefined) {
    return;
  }
  const methodName = meta.preDestroy;
  const lifecycleMethod = (instance as Record<string, unknown>)[methodName];
  if (typeof lifecycleMethod !== "function") {
    return;
  }
  await (lifecycleMethod as () => unknown).call(instance);
}

/**
 * Runs `onActivation`, awaiting if the handler returns a Promise.
 *
 * Lifecycle ordering: `construct` → `@postConstruct` → **`onActivation`** (async variant) → cache.
 */
export async function runActivationAsync(
  binding: Binding<unknown>,
  instance: unknown,
  ctx: ResolutionContext,
): Promise<unknown> {
  const handler = binding.onActivation;
  if (handler === undefined) {
    return instance;
  }
  return await handler(ctx, instance);
}
