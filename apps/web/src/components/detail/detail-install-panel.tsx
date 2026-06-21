import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

import { CopyField } from "#/components/detail/copy-field";
import { INSTALL_COMMAND } from "#/lib/install";
import type { ComponentMeta } from "#/registry/components";
import { componentImportLabel } from "#/registry/components";

interface DetailInstallPanelProps extends ComponentProps<"div"> {
  readonly component: ComponentMeta;
}

/** Install command and import path panel with copy buttons. */
export function DetailInstallPanel({ component, className, ...props }: DetailInstallPanelProps) {
  const isComposition = component.composition !== undefined;
  const importPath = componentImportLabel(component);

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)} {...props}>
      <CopyField label="Install" value={INSTALL_COMMAND} copyLabel="Copy install command" />
      <CopyField
        label={isComposition ? "Composed from" : "Import path"}
        value={importPath}
        valueClassName="text-ui-brand"
        copyLabel="Copy import path"
      />
    </div>
  );
}
