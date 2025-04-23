import { injectable } from "inversify";

import type { DependencyConfigServiceInterface } from "@/domain/interfaces/dependency-config.service";

@injectable()
export class DependencyConfigService implements DependencyConfigServiceInterface {
  private readonly MAIN_DEPENDENCIES: string[] = [
    "@codefast/ui",
    "@codefast/hooks",
    "recharts",
    "react-hook-form",
    "next-themes",
    "date-fns",
    "lucide-react",
  ];

  private readonly DEV_DEPENDENCIES: Record<string, string[]> = {
    commitLint: ["@commitlint/cli", "@commitlint/config-conventional", "@commitlint/types"],
    gitTools: ["simple-git-hooks"],
    formatting: ["prettier", "prettier-plugin-packagejson", "prettier-plugin-tailwindcss", "lint-staged"],
    linting: ["@codefast/eslint-config"],
  };

  private readonly PACKAGES_TO_REMOVE: string[] = ["@eslint/eslintrc", "eslint-config-next"];

  getMainDependencies(): string[] {
    return this.MAIN_DEPENDENCIES;
  }

  getDevDependencies(): Record<string, string[]> {
    return this.DEV_DEPENDENCIES;
  }

  getPackagesToRemove(): string[] {
    return this.PACKAGES_TO_REMOVE;
  }
}
