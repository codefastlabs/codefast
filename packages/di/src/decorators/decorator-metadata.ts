/**
 * The metadata record a decorator writes into, checked once for every decorator the library ships.
 */
import { MissingDecoratorMetadataError } from "#errors/errors";

/**
 * Returns the metadata record a decorator context carries.
 *
 * @throws `MissingDecoratorMetadataError` when the transpiler handed none, which is how a runtime
 * without `Symbol.metadata` shows up.
 */
export function decoratorMetadataOf(
  context: DecoratorContext,
  decoratorName: string,
): Record<string | symbol, unknown> {
  const metadata = context.metadata as Record<string | symbol, unknown> | undefined;
  if (metadata === undefined || metadata === null) {
    throw new MissingDecoratorMetadataError(decoratorName);
  }
  return metadata;
}
