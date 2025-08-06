#!/usr/bin/env node
import { runCLI } from "./infrastructure/cli/cli";

async function main(): Promise<void> {
  try {
    await runCLI();
  } catch (error) {
    console.error("CLI Error:", error instanceof Error ? error.message : "Unknown error");
    process.exit(1);
  }
}

await main();
