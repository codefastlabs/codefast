/**
 * Port for executing system commands, such as package installation and formatting.
 */
export interface CommandExecutorPort {
  checkEnvironment: () => void;
  cleanupPackages: () => void;
  enableGitHooks: () => void;
  installDependencies: () => void;
  runCommand: (command: string) => void;
  runFormatter: () => void;
  runLinter: () => void;
}
