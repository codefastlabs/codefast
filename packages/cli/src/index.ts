#!/usr/bin/env node

import type { CLIAdapter } from "@/infrastructure/adapters/cli.adapter";

import { container } from "@/ioc/container";
import { TYPES } from "@/ioc/types";

function main(): void {
  const cliAdapter = container.get<CLIAdapter>(TYPES.CLIAdapter);

  cliAdapter.initialize();
}

main();
