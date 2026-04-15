// oxlint-disable no-console

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { messageFromCaughtUnknown } from "#lib/core/application/utils/caught-unknown-message.util";
import { createCliRuntimeContainer } from "#lib/core/infra/composition-root";

const isArchitectureGuard = process.argv.includes("--architecture-guard");

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production" && !isArchitectureGuard) {
    console.error("[di:graph] Skipped in production environment.");
    return;
  }

  const container = createCliRuntimeContainer();
  try {
    try {
      container.validate();
    } catch (caughtError: unknown) {
      console.error(
        `[di:graph] Container validation failed (architecture guard): ${messageFromCaughtUnknown(caughtError)}`,
      );
      process.exit(1);
    }

    try {
      await container.initializeAsync();
    } catch (caughtError: unknown) {
      console.error(
        `[di:graph] Container async initialization failed: ${messageFromCaughtUnknown(caughtError)}`,
      );
      process.exit(1);
    }

    if (isArchitectureGuard) {
      return;
    }

    const dotGraph = container.inspect().generateDotGraph();
    const outputPath = path.resolve(process.cwd(), "architecture-graph.dot");
    await writeFile(outputPath, dotGraph, "utf8");
    console.log(
      "Architecture graph generated at architecture-graph.dot. Use Graphviz or an online viewer to visualize.",
    );
  } finally {
    container.disposeSync();
  }
}

void main().catch((caughtError: unknown) => {
  console.error(`[di:graph] ${messageFromCaughtUnknown(caughtError)}`);
  process.exit(1);
});
