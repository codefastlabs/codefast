#!/usr/bin/env node
import minimist from "minimist";

import { processAllPackages } from "@/core/processor";
import { Logger } from "@/lib/logger";

async function main(): Promise<void> {
  // Parse command line arguments
  const argv = minimist(process.argv.slice(2));

  const options = {
    packageFilter: argv.package ?? argv.p,
    dryRun: Boolean(argv["dry-run"] ?? argv.d),
    verbose: Boolean(argv.verbose ?? argv.v),
    configPath: argv.config ?? argv.c,
  };

  const logger = new Logger({ verbose: options.verbose });

  try {
    await processAllPackages(options, logger);
  } catch (error) {
    logger.error("Lỗi khi xử lý packages:", error);
    process.exit(1);
  }
}

await main();
