/** The surface every `tv()` library exposes to the shared scenarios, so each scenario is written once. */

/**
 * Options passed through to a library's `tv`, whose own option types differ.
 */
export type TvOptions = Readonly<Record<string, unknown>>;

/**
 * One `tv()` library as the shared scenarios drive it.
 *
 * @remarks Each library's generics are widened here, the suite's one typing escape hatch, so one fixture
 * configuration fits every library; a scenario narrows what a resolver returns to the renderer it calls.
 */
export interface TvLibrary {
  /** Joins class values and resolves Tailwind conflicts between them. */
  readonly cn: (...classes: ReadonlyArray<unknown>) => string;
  /** A `tv` bound to shared options, whatever shape the library's own factory returns. */
  readonly createTv: (options: TvOptions) => (config: object) => unknown;
  /** Defines a resolver for a fixture configuration. */
  readonly tv: (config: object, options?: TvOptions) => unknown;
}
