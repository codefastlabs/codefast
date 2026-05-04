import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { JsonlBenchObservationRow } from "#/report/jsonl";
import type { Fingerprint, TrialPayload } from "#/shared/protocol";

/** Writes a pre-rendered markdown string to `outputPath`, creating parent directories as needed. */
export function writeMarkdownFile(outputPath: string, markdown: string): void {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${markdown}\n`, "utf8");
}

function flattenLibraryToJsonl(
  fingerprint: Fingerprint,
  trials: readonly TrialPayload[],
): JsonlBenchObservationRow[] {
  const observations: JsonlBenchObservationRow[] = [];
  for (const trial of trials) {
    for (const scenarioResult of trial.scenarios) {
      observations.push({
        timestampIso: fingerprint.timestampIso,
        libraryName: fingerprint.libraryName,
        libraryVersion: fingerprint.libraryVersion,
        nodeVersion: fingerprint.nodeVersion,
        v8Version: fingerprint.v8Version,
        platform: fingerprint.platform,
        arch: fingerprint.arch,
        cpuModel: fingerprint.cpuModel,
        cpuCount: fingerprint.cpuCount,
        nodeOptions: fingerprint.nodeOptions,
        gcExposed: fingerprint.gcExposed,
        trialIndex: trial.trialIndex,
        scenarioId: scenarioResult.id,
        group: scenarioResult.group,
        stress: scenarioResult.stress,
        batch: scenarioResult.batch,
        what: scenarioResult.what,
        hzPerIteration: scenarioResult.hzPerIteration,
        hzPerOp: scenarioResult.hzPerOp,
        meanMs: scenarioResult.meanMs,
        p75Ms: scenarioResult.p75Ms,
        p99Ms: scenarioResult.p99Ms,
        p999Ms: scenarioResult.p999Ms,
        samples: scenarioResult.samples,
      });
    }
  }
  return observations;
}

/** Writes one JSONL file containing flattened observations from one or more libraries. */
export function writeJsonlRun(
  outputPath: string,
  libraries: readonly { fingerprint: Fingerprint; trials: readonly TrialPayload[] }[],
): void {
  const allObservations = libraries.flatMap((library) =>
    flattenLibraryToJsonl(library.fingerprint, library.trials),
  );
  const serialised = allObservations.map((observation) => JSON.stringify(observation)).join("\n");
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${serialised}\n`, "utf8");
}
