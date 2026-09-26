/**
 * The metadata record a decorator writes into, checked once for every decorator the library ships.
 */
import { MissingDecoratorMetadataError } from "#errors/errors";

/**
 * Returns the metadata record a decorator context carries.
 *
 * @throws `MissingDecoratorMetadataError` when the transpiler handed none, which is how a runtime
 * without `Symbol.metadata` shows up.
 *
 * @since 0.11.0
 */
export function decoratorMetadataOf(
  context: DecoratorContext,
  decoratorName: string,
): Record<string | symbol, unknown> {
  // Widened, not asserted: the lib types promise a record that a runtime without `Symbol.metadata` never hands over.
  const metadata: DecoratorMetadataObject | null | undefined = context.metadata;
  if (metadata === undefined || metadata === null) {
    throw new MissingDecoratorMetadataError(decoratorName);
  }
  return metadata;
}
