/**
 * A workspace package's `engines.node` floor.
 *
 * @since 0.15.0
 */
export type PackageEngineFloor = {
  readonly packageName: string;
  /** Repo-relative POSIX path of the package directory. */
  readonly directory: string;
  /** The floor as `X.Y.Z`. */
  readonly floor: string;
};

/**
 * A package whose Node floor breaks a rule a consumer or CI depends on.
 *
 * @since 0.15.0
 */
export type EngineViolation =
  | { readonly kind: "missing-floor"; readonly packageName: string }
  | { readonly kind: "unparsable-floor"; readonly packageName: string; readonly range: string }
  | {
      readonly kind: "outside-dependency-engines";
      readonly packageName: string;
      readonly floor: string;
      readonly dependency: string;
      /** The manifest field that lists the dependency. */
      readonly field: string;
      /** The dependency's own `engines.node`. */
      readonly range: string;
      /** The releases the floor claims that `range` leaves out, as semver ranges joined by `||`. */
      readonly uncovered: string;
    }
  | {
      readonly kind: "root-outside-dependency-engines";
      /** The workspace root's name. */
      readonly packageName: string;
      readonly floor: string;
      readonly dependency: string;
      /** The dependency's own `engines.node`. */
      readonly range: string;
      /** The workspace packages that install the dependency at this range. */
      readonly dependents: Array<string>;
      /** The releases the root floor claims that `range` leaves out, as semver ranges joined by `||`. */
      readonly uncovered: string;
    }
  | {
      readonly kind: "divergent-floor";
      readonly packageName: string;
      readonly floor: string;
      /** The floor the other published packages share, the highest when they disagree. */
      readonly sharedFloor: string;
    }
  | {
      readonly kind: "types-off-floor";
      readonly packageName: string;
      readonly floor: string;
      readonly typesVersion: string;
    };

/**
 * Returns the text that identifies a violation in its manifest, which an allowlist entry matches, and the needle that
 * finds its line there.
 */
export function violationText(violation: EngineViolation): { readonly text: string; readonly needle: string } {
  switch (violation.kind) {
    case "missing-floor":
      return { text: "engines.node", needle: '"name"' };
    case "unparsable-floor":
      return { text: `engines.node "${violation.range}"`, needle: '"engines"' };
    case "divergent-floor":
      return { text: `engines.node ">=${violation.floor}"`, needle: '"engines"' };
    case "types-off-floor":
      return { text: `@types/node ${violation.typesVersion}`, needle: '"engines"' };
    case "outside-dependency-engines":
      return { text: `${violation.dependency}@${violation.range}`, needle: `"${violation.dependency}"` };
    case "root-outside-dependency-engines":
      return { text: `${violation.dependency}@${violation.range}`, needle: '"engines"' };
  }
}

/**
 * Returns what a violation breaks and how to fix it, in one line.
 */
export function describeViolation(violation: EngineViolation): string {
  switch (violation.kind) {
    case "missing-floor":
      return "a published package states the Node floor it supports — declare engines.node";
    case "unparsable-floor":
      return 'write the floor as ">=X.Y.Z"';
    case "outside-dependency-engines":
      return `floor ${violation.floor} claims Node "${violation.uncovered}", which ${violation.dependency}'s engines.node "${violation.range}" (${violation.field}) leaves out — raise the floor or drop the dependency`;
    case "root-outside-dependency-engines":
      return `the root floor ${violation.floor} claims Node "${violation.uncovered}", which ${violation.dependency}'s engines.node "${violation.range}" (installed for ${violation.dependents.join(", ")}) leaves out — raise the root floor or drop the dependency`;
    case "divergent-floor":
      return `differs from ${violation.sharedFloor}, which the other published packages ship on — declare ">=${violation.sharedFloor}"`;
    case "types-off-floor":
      return `off floor ${violation.floor}'s line — pin @types/node to the floor's major at a minor no newer`;
  }
}
