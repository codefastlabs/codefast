/** The error taxonomy `@codefast/di-testing` raises, each carrying a machine-readable `code`. */

/**
 * Base class for every error the testing library throws, each carrying a machine-readable `code`.
 *
 * @remarks Mirrors `@codefast/di`'s own `DiError` shape rather than extending it, so a caller can
 * catch testing-setup failures separately from resolution failures.
 */
export abstract class TestingError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * The class under test takes constructor parameters but carries no `@injectable` metadata.
 */
export class NotInjectableError extends TestingError {
  readonly code = "NOT_INJECTABLE";
  readonly targetName: string;

  constructor(targetName: string) {
    super(
      `Cannot build a solitary test bed for '${targetName}': its constructor takes parameters but the class is not decorated with @injectable(...), so those dependencies cannot be discovered. Decorate the class, or bind its collaborators manually with a Container.`,
    );
    this.targetName = targetName;
  }
}

/**
 * A `.mock(...)` override or a `unitRef.get(...)` lookup named a token the unit does not depend on.
 *
 * @remarks Almost always a typo or a stale token reference; failing loudly beats silently binding an
 * unused constant or returning `undefined`.
 */
export class UndeclaredDependencyError extends TestingError {
  readonly code = "UNDECLARED_DEPENDENCY";
  readonly tokenName: string;

  constructor(tokenName: string) {
    super(
      `'${tokenName}' is not a dependency of the class under test. Only tokens the class declares in its constructor or accessor injections can be mocked or retrieved.`,
    );
    this.tokenName = tokenName;
  }
}
