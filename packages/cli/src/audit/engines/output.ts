import type { EngineViolation, EnginesAuditResult } from "#audit/domain/types";
import { logger } from "#core/logger";

/**
 * Human-readable engines audit report.
 *
 * @since 0.15.0
 */
export function presentEnginesAuditResult(result: EnginesAuditResult): void {
  for (const violation of result.violations) {
    logger.out(`\n${violation.packageName}: ${describeViolation(violation)}`);
  }

  if (result.violations.length > 0) {
    logger.out(`\n✖ ${result.violations.length} Node floor violation(s) across ${result.packageCount} package(s)`);
    return;
  }

  const counts = new Map<string, number>();
  for (const { floor } of result.floors) {
    counts.set(floor, (counts.get(floor) ?? 0) + 1);
  }
  const summary = [...counts].map(([floor, count]) => `${floor} (${count})`).join(", ") || "none declared";
  logger.out(`✓ Every Node floor holds across ${result.packageCount} package(s): ${summary}`);
}

function describeViolation(violation: EngineViolation): string {
  switch (violation.kind) {
    case "missing-floor": {
      return `declares no engines.node → a published package states the Node floor it supports`;
    }
    case "unparsable-floor": {
      return `engines.node "${violation.range}" → write the floor as ">=X.Y.Z"`;
    }
    case "outside-dependency-engines": {
      return `floor ${violation.floor} claims Node "${violation.uncovered}", which ${violation.dependency}'s engines.node "${violation.range}" (${violation.field}) leaves out → raise the floor or drop the dependency`;
    }
    case "root-outside-dependency-engines": {
      return `workspace root floor ${violation.floor} claims Node "${violation.uncovered}", which ${violation.dependency}'s engines.node "${violation.range}" (installed for ${violation.dependents.join(", ")}) leaves out → raise the root floor or drop the dependency`;
    }
    case "types-off-floor": {
      return `@types/node resolves to ${violation.typesVersion}, off floor ${violation.floor}'s line → pin it to the floor's major at a minor no newer`;
    }
  }
}
