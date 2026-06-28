import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

import { CopyField } from "#/components/detail/copy-field";
import { INSTALL_COMMAND } from "#/lib/install";

type DetailInstallPanelProps = ComponentProps<"div">;

/** Install command for the package, with a copy button. */
export function DetailInstallPanel({ className, ...props }: DetailInstallPanelProps) {
  return (
    <div className={cn("max-w-md", className)} {...props}>
      <CopyField label="Install" value={INSTALL_COMMAND} copyLabel="Copy install command" />
    </div>
  );
}
