import type { Project } from "@/domain/entities/project";

/**
 * Interface for project repository operations, including creation and configuration.
 */
export interface ProjectRepositoryInterface {
  checkExistingProject: (projectName?: string) => Promise<Project>;
  createNextProject: (projectName: string) => void;
  updateLayoutFile: (projectDir: string) => void;
  updateNextConfig: (projectDir: string) => void;
  updatePackageJson: (projectDir: string) => void;
  updatePageFile: (projectDir: string) => void;
  updatePostcssConfig: (projectDir: string) => void;
}
