/**
 * Command Handler
 *
 * Commands layer command handler using Commander.js.
 * Following explicit architecture guidelines for CLI applications.
 * Uses command registry for scalable command organization.
 */

import { Command } from "commander";
import { inject, injectable } from "inversify";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

import type { CommandRegistry } from "@/ui/controllers/registry/command.registry";

import { TYPES } from "@/shared/di/types";

@injectable()
export class CommandHandler {
  private readonly program: Command;

  constructor(
    @inject(TYPES.CommandRegistry)
    private readonly commandRegistry: CommandRegistry,
  ) {
    this.program = new Command();
    this.setupCommands();
  }

  run(argv?: string[]): void {
    this.program.parse(argv);
  }

  private setupCommands(): void {
    // Get package version
    const __filename = url.fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    // Navigate from dist/cjs/ui/controllers/ back to package root
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, "..", "..", "..", "..", "package.json"), "utf8"),
    ) as {
      version: string;
    };
    const { version } = packageJson;

    // Setup main program
    this.program
      .name("codefast")
      .description("CLI tools for CodeFast development")
      .version(version)
      .action(() => {
        this.program.help();
      });

    // Register all commands from the registry
    const commands = this.commandRegistry.getCommands();

    for (const command of commands) {
      command.register(this.program);
    }
  }
}
