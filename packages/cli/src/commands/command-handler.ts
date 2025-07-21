/**
 * Command Handler
 *
 * Commands layer command handler using Commander.js.
 * Following explicit architecture guidelines for CLI applications.
 * Uses command registry for scalable command organization.
 */

import { Command } from "commander";
import { inject, injectable } from "inversify";

import type { CommandRegistry } from "@/commands/registry/command.registry";
import type { FileSystemSystemPort } from "@/core/application/ports/system/file-system.system.port";
import type { PathSystemPort } from "@/core/application/ports/system/path.system.port";
import type { UrlSystemPort } from "@/core/application/ports/system/url.system.port";

import { TYPES } from "@/di/types";

@injectable()
export class CommandHandler {
  private readonly program: Command;

  constructor(
    @inject(TYPES.CommandRegistry)
    private readonly commandRegistry: CommandRegistry,
    @inject(TYPES.FilesystemSystemPort)
    private readonly fileSystemService: FileSystemSystemPort,
    @inject(TYPES.PathSystemPort)
    private readonly pathService: PathSystemPort,
    @inject(TYPES.UrlSystemPort)
    private readonly urlService: UrlSystemPort,
  ) {
    this.program = new Command();
    this.setupCommands();
  }

  run(argv?: string[]): void {
    this.program.parse(argv);
  }

  private setupCommands(): void {
    // Get package version
    const __filename = this.urlService.fileURLToPath(import.meta.url);
    const __dirname = this.pathService.dirname(__filename);
    const packageJson = JSON.parse(
      this.fileSystemService.readFileSync(
        this.pathService.join(__dirname, "..", "..", "..", "package.json"),
        "utf8",
      ),
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
