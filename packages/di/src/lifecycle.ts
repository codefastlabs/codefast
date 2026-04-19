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
 * Reads lifecycle metadata directly from a constructor's Symbol.metadata.
 */
export function readLifecycleMetadataFromCtor(
  implementationClass: Constructor<unknown>,
): LifecycleMetadata | undefined {
  const metadataSymbol = decoratorMetadataObjectSymbol();
  if (metadataSymbol === undefined) {
    return Reflect.getMetadata(CODEFAST_DI_LIFECYCLE_METADATA, implementationClass);
  }
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
 * Runs the `@postConstruct()` method synchronously if present. Throws if it returns a Promise.
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
  if (
    typeof postConstructResult === "object" &&
    postConstructResult !== null &&
    "then" in postConstructResult &&
    typeof (postConstructResult as Promise<unknown>).then === "function"
  ) {
    const bindingLabel = pathLabels[pathLabels.length - 1] ?? "(unknown)";
    throw new AsyncResolutionError(
      bindingLabel,
      pathLabels,
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
 * Runs the `@preDestroy()` method synchronously if present. Throws if it returns a Promise.
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
  if (
    typeof preDestroyResult === "object" &&
    preDestroyResult !== null &&
    "then" in preDestroyResult &&
    typeof (preDestroyResult as Promise<unknown>).then === "function"
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
