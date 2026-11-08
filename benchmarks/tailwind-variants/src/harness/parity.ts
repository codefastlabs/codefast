/** Fails when `@codefast/tailwind-variants` and `tailwind-variants` resolve a shared row's workload differently. */
import { codefast } from "#lib/codefast";
import { tailwindVariants } from "#lib/tailwind-variants";
import { collectTvScenarios } from "#scenarios/collect-tv-scenarios";

// Three passes reach every lane a lazy library has: the first calls, the call that compiles, and the cached answers.
const PASSES = 3;

const firstDifference = (left: string, right: string): string => {
  const leftLines = left.split("\n");
  const rightLines = right.split("\n");
  const line = leftLines.findIndex((text, index) => text !== rightLines[index]);
  const at = line === -1 ? leftLines.length : line;

  return `line ${String(at + 1)}\n    @codefast/tv:      ${leftLines[at] ?? "(none)"}\n    tailwind-variants: ${rightLines[at] ?? "(none)"}`;
};

function main(): void {
  const reference = new Map(collectTvScenarios(tailwindVariants).map((scenario) => [scenario.id, scenario]));
  const failures: Array<string> = [];
  let compared = 0;

  for (const scenario of collectTvScenarios(codefast)) {
    const other = reference.get(scenario.id);

    if (scenario.output === undefined || other?.output === undefined) {
      continue;
    }

    compared++;

    for (let pass = 1; pass <= PASSES; pass++) {
      const subject = scenario.output();
      const expected = other.output();

      if (subject !== expected) {
        failures.push(`${scenario.id} (pass ${String(pass)}): ${firstDifference(subject, expected)}`);
        break;
      }
    }
  }

  if (failures.length > 0) {
    console.error(`${String(failures.length)} of ${String(compared)} rows resolve differently:\n`);
    console.error(failures.map((failure) => `  ${failure}`).join("\n\n"));
    process.exitCode = 1;

    return;
  }

  console.log(`All ${String(compared)} shared rows resolve to the same classes in both libraries.`);
}

main();
