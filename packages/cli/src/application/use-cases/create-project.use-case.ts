import { inject, injectable } from "inversify";

import type { CommandExecutorPort } from "@/application/ports/command-executor.port";
import type { FileSystemPort } from "@/application/ports/file-system.port";
import type { PromptPort } from "@/application/ports/prompt.port";
import type { ConfigGroups } from "@/domain/entities/config-file";
import type { Project } from "@/domain/entities/project";
import type { ProjectRepositoryInterface } from "@/domain/interfaces/project.repository";

import { handleError } from "@/application/utilities/error-handler";
import { ConfigService } from "@/infrastructure/services/config.service";
import { TYPES } from "@/ioc/types";

@injectable()
export class CreateProjectUseCase {
  constructor(
    @inject(TYPES.ProjectRepository) private projectRepository: ProjectRepositoryInterface,
    @inject(TYPES.FileSystemPort) private fileSystemPort: FileSystemPort,
    @inject(TYPES.CommandExecutorPort) private commandExecutorPort: CommandExecutorPort,
    @inject(TYPES.PromptPort) private promptPort: PromptPort,
    @inject(TYPES.ConfigService) private configService: ConfigService,
  ) {}

  /**
   * Executes the project creation or configuration process.
   * @param projectName - Optional project name provided via CLI.
   *
   * @returns The created or configured project.
   */
  async execute(projectName?: string): Promise<Project> {
    try {
      this.commandExecutorPort.checkEnvironment();
      const project = await this.checkExistingProject(projectName);
      const configGroups = this.configService.getConfigGroups();

      this.createOrConfigureProject(project, configGroups);
      this.displaySuccessMessage(project);

      return project;
    } catch (error) {
      handleError(error, "Failed to create or configure project");
      throw error;
    } finally {
      this.promptPort.close();
    }
  }

  private async checkExistingProject(projectNameArg?: string): Promise<Project> {
    return await this.projectRepository.checkExistingProject(projectNameArg);
  }

  private createOrConfigureProject(project: Project, configGroups: ConfigGroups): void {
    if (!project.packageJsonExists) {
      console.log(`\n🚀 Starting project creation for ${project.name}...\n`);
      this.projectRepository.createNextProject(project.name);
      process.chdir(project.name);
      console.log(`📂 Moved to ${project.name}`);
    }

    this.updateProjectFiles(project.directory);
    this.commandExecutorPort.installDependencies();
    this.commandExecutorPort.cleanupPackages();
    this.fileSystemPort.createConfigFiles(project.directory, configGroups);
    this.projectRepository.updateNextConfig(project.directory);
    this.projectRepository.updatePackageJson(project.directory);
    this.commandExecutorPort.enableGitHooks();
    this.commandExecutorPort.runFormatter();
    this.commandExecutorPort.runLinter();
  }

  private updateProjectFiles(projectDir: string): void {
    this.projectRepository.updateLayoutFile(projectDir);
    this.projectRepository.updatePageFile(projectDir);
    this.projectRepository.updatePostcssConfig(projectDir);
  }

  private displaySuccessMessage(project: Project): void {
    console.log(`\n✅ Project ${project.packageJsonExists ? "configured" : "created"} successfully!`);
    console.log(`- Project: ${project.name}`);
    console.log("- Next.js with TypeScript");
    console.log("- TailwindCSS and @codefast/ui");
    console.log("- ESLint, Prettier, Commitlint, and Git Hooks");
    console.log("- Lint-staged for pre-commit checks");
    console.log(`\n📁 Project directory: ${process.cwd()}`);
    console.log(`\n🚀 To start development:`);
    console.log(`${project.packageJsonExists ? `cd ${project.name} && ` : ""}pnpm dev`);
  }
}
