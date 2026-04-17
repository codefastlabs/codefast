import type { Binding, ResolutionContext } from "#/binding";
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
