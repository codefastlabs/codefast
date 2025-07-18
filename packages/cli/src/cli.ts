#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Command } from "commander";

import { logger } from "@/utils";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(path.join(__dirname, "..", "..", "package.json"), "utf8"),
) as {
  version: string;
};
const { version } = packageJson;

const program = new Command();

program
  .name("codefast")
  .description("CLI tools for CodeFast development")
  .version(version)
  .action(() => {
    program.help();
  });

program
  .command("hello")
  .description("Say hello")
  .option("-n, --name <name>", "name to greet", "World")
  .action((options: { name: string }) => {
    logger.success(`Hello, ${options.name}!`);
  });

program.parse();
