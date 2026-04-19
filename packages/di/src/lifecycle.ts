import type { Binding, Constructor, ResolutionContext } from "#/binding";
import {
  CODEFAST_DI_LIFECYCLE_METADATA,
  decoratorMetadataObjectSymbol,
  type LifecycleMetadata,
} from "#/decorators/metadata";
import { AsyncResolutionError } from "#/errors";

function isPromiseLike(value: unknown): value is Promise<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof (value as Promise<unknown>).then === "function"
  );
}

/**
 * Runs `onActivation` synchronously; rejects async activations on sync resolution paths.
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
  const tokenLabel = pathLabels[pathLabels.length - 1] ?? "(unknown)";
  const result = handler(ctx, instance);
  if (isPromiseLike(result)) {
    throw new AsyncResolutionError(
      tokenLabel,
      pathLabels,
      "onActivation returned a Promise during synchronous resolution",
    );
  }
  return result;
}

/**
 * Reads lifecycle metadata directly from a constructor's Symbol.metadata.
 */
export function readLifecycleMetadataFromCtor(
  ctor: Constructor<unknown>,
): LifecycleMetadata | undefined {
  const metaKey = decoratorMetadataObjectSymbol();
  const bucket = (ctor as unknown as Record<symbol, unknown>)[metaKey];
  if (typeof bucket !== "object" || bucket === null) {
    return undefined;
  }
  const raw = (bucket as Record<PropertyKey, unknown>)[CODEFAST_DI_LIFECYCLE_METADATA];
  return typeof raw === "object" && raw !== null ? (raw as LifecycleMetadata) : undefined;
}

/**
 * Runs the `@postConstruct()` method synchronously if present. Throws if it returns a Promise.
 */
export function runPostConstruct(
  ctor: Constructor<unknown>,
  instance: unknown,
  pathLabels: readonly string[],
): void {
  const meta = readLifecycleMetadataFromCtor(ctor);
  if (meta?.postConstruct === undefined) {
    return;
  }
  const methodName = meta.postConstruct;
  const method = (instance as Record<string, unknown>)[methodName];
  if (typeof method !== "function") {
    return;
  }
  const result = (method as () => unknown).call(instance);
  if (
    typeof result === "object" &&
    result !== null &&
    "then" in result &&
    typeof (result as Promise<unknown>).then === "function"
  ) {
    const tokenLabel = pathLabels[pathLabels.length - 1] ?? "(unknown)";
    throw new AsyncResolutionError(
      tokenLabel,
      pathLabels,
      `@postConstruct() "${methodName}" returned a Promise during synchronous resolution`,
    );
  }
}

/**
 * Runs the `@postConstruct()` method, awaiting if it returns a Promise.
 */
export async function runPostConstructAsync(
  ctor: Constructor<unknown>,
  instance: unknown,
): Promise<void> {
  const meta = readLifecycleMetadataFromCtor(ctor);
  if (meta?.postConstruct === undefined) {
    return;
  }
  const methodName = meta.postConstruct;
  const method = (instance as Record<string, unknown>)[methodName];
  if (typeof method !== "function") {
    return;
  }
  await (method as () => unknown).call(instance);
}

/**
 * Runs the `@preDestroy()` method synchronously if present. Throws if it returns a Promise.
 */
export function runPreDestroy(ctor: Constructor<unknown>, instance: unknown): void {
  const meta = readLifecycleMetadataFromCtor(ctor);
  if (meta?.preDestroy === undefined) {
    return;
  }
  const methodName = meta.preDestroy;
  const method = (instance as Record<string, unknown>)[methodName];
  if (typeof method !== "function") {
    return;
  }
  const result = (method as () => unknown).call(instance);
  if (
    typeof result === "object" &&
    result !== null &&
    "then" in result &&
    typeof (result as Promise<unknown>).then === "function"
  ) {
    throw new Error(
      `@preDestroy() "${methodName}" returned a Promise during synchronous disposal; use disposeAsync() / unloadAsync().`,
    );
  }
}

/**
 * Runs the `@preDestroy()` method, awaiting if it returns a Promise.
 */
export async function runPreDestroyAsync(
  ctor: Constructor<unknown>,
  instance: unknown,
): Promise<void> {
  const meta = readLifecycleMetadataFromCtor(ctor);
  if (meta?.preDestroy === undefined) {
    return;
  }
  const methodName = meta.preDestroy;
  const method = (instance as Record<string, unknown>)[methodName];
  if (typeof method !== "function") {
    return;
  }
  await (method as () => unknown).call(instance);
}

/**
 * Runs `onActivation`, awaiting promises returned by the handler.
 */
export async function runActivationAsync(
  binding: Binding<unknown>,
  instance: unknown,
  ctx: ResolutionContext,
  _pathLabels: readonly string[],
): Promise<unknown> {
  const handler = binding.onActivation;
  if (handler === undefined) {
    return instance;
  }
  return await handler(ctx, instance);
}
