#!/usr/bin/env node

import { Command } from "commander";

import { logger } from "@/utils";
import { version } from "~/package.json";

const program = new Command();

program.name("codefast").description("CLI tools for CodeFast development").version(version);

program
  .command("hello")
  .description("Say hello")
  .option("-n, --name <name>", "name to greet", "World")
  .action((options: { name: string }) => {
    logger.success(`Hello, ${options.name}!`);
  });

program.parse();
