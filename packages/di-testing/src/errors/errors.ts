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
 * A scanned class takes constructor parameters but carries no `@injectable` metadata.
 */
export class NotInjectableError extends TestingError {
  readonly code = "NOT_INJECTABLE";
  readonly targetName: string;

  constructor(targetName: string) {
    super(
      `Cannot mock the dependencies of '${targetName}': its constructor takes parameters but the class is not decorated with @injectable(...), so those dependencies cannot be discovered. Decorate the class, or bind its collaborators manually with a Container.`,
    );
    this.targetName = targetName;
  }
}

/**
 * A `.mock(...)` override or a `mocks.get(...)` lookup named a token or slot the unit does not use.
 *
 * @remarks Almost always a typo or a stale token reference; failing loudly beats silently binding an
 * unused constant or returning `undefined`.
 */
export class UndeclaredDependencyError extends TestingError {
  readonly code = "UNDECLARED_DEPENDENCY";
  readonly tokenName: string;

  constructor(tokenName: string, detail?: string) {
    super(
      `'${tokenName}'${detail === undefined ? "" : ` (${detail})`} is not a dependency of the class under test. Only tokens the class declares in its constructor or accessor injections can be mocked or retrieved.`,
    );
    this.tokenName = tokenName;
  }
}

/** What a sealed entry was supplied with, naming the one cause a lookup error should report. */
export type SealedCause = "value" | "absent" | "all" | "exposed";

const SEALED_MESSAGES: Readonly<Record<SealedCause, string>> = {
  value: "it was supplied with .using(), so it has no mock surface. Use the reference the test passed in.",
  absent: "it was declared absent with .absent(), so there is nothing to retrieve.",
  all: "its elements were supplied with .usingAll(). Use the references the test passed in.",
  exposed: "it is exposed as a real collaborator. Retrieve it with bed.exposed(Class) instead.",
};

/**
 * A `mocks.get(...)` lookup asked for a dependency that is not a retrievable mock.
 *
 * @remarks `.using()`, `.absent()`, and `.usingAll()` seal the value, and an exposed class is real —
 * none of them carries a mock surface, so handing them back typed as `Mocked` would lie.
 */
export class SealedDependencyError extends TestingError {
  readonly code = "SEALED_DEPENDENCY";
  readonly tokenName: string;

  constructor(tokenName: string, cause: SealedCause) {
    super(`'${tokenName}' is not a retrievable mock: ${SEALED_MESSAGES[cause]}`);
    this.tokenName = tokenName;
  }
}

/**
 * An override whose shape does not fit the slot it targets — `.absent()` on a required dependency,
 * or `.usingAll()` where no unconstrained `injectAll()` slot exists.
 */
export class OverrideMismatchError extends TestingError {
  readonly code = "OVERRIDE_MISMATCH";
  readonly tokenName: string;

  constructor(tokenName: string, detail: string) {
    super(`'${tokenName}': ${detail}`);
    this.tokenName = tokenName;
  }
}

/**
 * A sociable bed's exposure could not be honoured — the class is unreachable, already the unit, or
 * was asked for without having been exposed.
 */
export class ExposureError extends TestingError {
  readonly code = "EXPOSURE";
  readonly targetName: string;

  constructor(targetName: string, detail: string) {
    super(`'${targetName}': ${detail}`);
    this.targetName = targetName;
  }
}
