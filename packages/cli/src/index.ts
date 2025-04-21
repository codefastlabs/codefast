#!/usr/bin/env node

import { Command } from "commander";

import { createProjectCommand } from "@/commands/create-project/command";
import { createUpdateExportsCommand } from "@/commands/update-exports";
import { getPackageVersion } from "@/lib/package-info";

function main(): void {
  const program = new Command();

  program
    .name("codefast")
    .description("CodeFast CLI - A development toolkit for CodeFast.")
    .version(getPackageVersion(), "-v, --version", "display CLI version");

  createUpdateExportsCommand(program);
  createProjectCommand(program);

  program.parse(process.argv);
}

main();
