/**
 * CLI Application
 *
 * Presentation layer CLI application using Commander.js.
 * Following explicit architecture guidelines for CLI applications.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Command } from 'commander';
import { inject, injectable } from 'inversify';

import type { AnalyzeProjectUseCase } from '@/core/application/use-cases/analyze-project.use-case';
import type { GreetUserUseCase } from '@/core/application/use-cases/greet-user.use-case';

import { TYPES } from '@/di/types';

@injectable()
export class CLIApplication {
  private readonly program: Command;

  constructor(
    @inject(TYPES.AnalyzeProjectUseCase) private readonly analyzeProjectUseCase: AnalyzeProjectUseCase,
    @inject(TYPES.GreetUserUseCase) private readonly greetUserUseCase: GreetUserUseCase,
  ) {
    this.program = new Command();
    this.setupCommands();
  }

  private setupCommands(): void {
    // Get package version
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const packageJson = JSON.parse(
      readFileSync(path.join(__dirname, '..', '..', '..', 'package.json'), 'utf8'),
    ) as {
      version: string;
    };
    const { version } = packageJson;

    // Setup main program
    this.program
      .name('codefast')
      .description('CLI tools for CodeFast development')
      .version(version)
      .action(() => {
        this.program.help();
      });

    // Hello command
    this.program
      .command('hello')
      .description('Say hello')
      .option('-n, --name <name>', 'name to greet', 'World')
      .action((options: { name: string }) => {
        this.greetUserUseCase.execute({ name: options.name });
      });

    // Analyze command
    this.program
      .command('analyze')
      .description('Analyze TypeScript project')
      .option('-p, --pattern <pattern>', 'file pattern to analyze', 'src/**/*.ts')
      .option('-c, --config <path>', 'path to tsconfig.json')
      .action(async (options: { pattern?: string; config?: string }) => {
        await this.analyzeProjectUseCase.execute({
          pattern: options.pattern,
          tsConfigPath: options.config,
        });
      });
  }

  run(argv?: string[]): void {
    this.program.parse(argv);
  }
}
