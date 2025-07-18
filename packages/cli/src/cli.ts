#!/usr/bin/env node

import chalk from "chalk";
import { Command } from "commander";

import { version } from "../package.json";

const program = new Command();

program
  .name("codefast")
  .description("CLI tools for CodeFast development")
  .version(version);

program
  .command("hello")
  .description("Say hello")
  .option("-n, --name <name>", "name to greet", "World")
  .action((options) => {
    console.log(chalk.green(`Hello, ${options.name}!`));
  });

program.parse();
