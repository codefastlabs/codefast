#!/usr/bin/env node

import { Command } from "commander";

import { createProjectCommand } from "@/commands/create-project/command";
import { updateExportsCommand } from "@/commands/update-exports/command";
import { getPackageVersion } from "@/lib/package-info";

function main(): void {
  const program = new Command();

  program
    .name("codefast")
    .description("CodeFast CLI - A development toolkit for CodeFast.")
    .version(getPackageVersion(), "-v, --version", "display CLI version")
    .addCommand(updateExportsCommand)
    .addCommand(createProjectCommand)
    .parse(process.argv);
}

main();
