/**
 * Command Handler
 *
 * Commands layer command handler using Commander.js.
 * Following explicit architecture guidelines for CLI applications.
 */

import { Command } from "commander";
import { inject, injectable } from "inversify";

import type { FileSystemSystemPort } from "@/core/application/ports/system/file-system.system.port";
import type { PathSystemPort } from "@/core/application/ports/system/path.system.port";
import type { UrlSystemPort } from "@/core/application/ports/system/url.system.port";
import type { AnalyzeProjectUseCase } from "@/core/application/use-cases/analyze-project.use-case";
import type { CheckComponentTypesUseCase } from "@/core/application/use-cases/check-component-types.use-case";
import type { GreetUserUseCase } from "@/core/application/use-cases/greet-user.use-case";

import { TYPES } from "@/di/types";

@injectable()
export class CommandHandler {
  private readonly program: Command;

  constructor(
    @inject(TYPES.AnalyzeProjectUseCase)
    private readonly analyzeProjectUseCase: AnalyzeProjectUseCase,
    @inject(TYPES.CheckComponentTypesUseCase)
    private readonly checkComponentTypesUseCase: CheckComponentTypesUseCase,
    @inject(TYPES.GreetUserUseCase)
    private readonly greetUserUseCase: GreetUserUseCase,
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

    // Hello command
    this.program
      .command("hello")
      .description("Say hello")
      .option("-n, --name <name>", "name to greet", "World")
      .action((options: { name: string }) => {
        this.greetUserUseCase.execute({ name: options.name });
      });

    // Analyze command
    this.program
      .command("analyze")
      .description("Analyze TypeScript project")
      .option("-p, --pattern <pattern>", "file pattern to analyze", "src/**/*.ts")
      .option("-c, --config <path>", "path to tsconfig.json")
      .action(async (options: { pattern?: string; config?: string }) => {
        await this.analyzeProjectUseCase.execute({
          pattern: options.pattern,
          tsConfigPath: options.config,
        });
      });

    // Check component types command
    this.program
      .command("check-component-types")
      .description("Check React component type correspondence")
      .option("-d, --packages-dir <dir>", "packages directory to analyze", "packages")
      .action((options: { packagesDir?: string }) => {
        this.checkComponentTypesUseCase.execute({
          packagesDirectory: options.packagesDir,
        });
      });
  }
}
