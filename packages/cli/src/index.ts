#!/usr/bin/env node

import { Command } from "commander";

import { createUpdateExportsCommand } from "@/commands/update-exports";

import packageJson from "../package.json";

function main(): void {
  const program = new Command();

  program
    .name("codefast")
    .description("CodeFast CLI - A development toolkit for CodeFast.")
    .version(packageJson.version, "-v, --version", "display CLI version");

  createUpdateExportsCommand(program);

  program.action(() => {
    console.log('Use "codefast update-exports" to update exports.');
    console.log('Run "codefast --help" to see all available commands.');
    program.help();
  });

  program.parse(process.argv);
}

main();
