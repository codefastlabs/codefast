import { SettingsDialog } from "@/registry/blocks/sidebar-13/_components/settings-dialog";

import type { JSX } from "react";

export default function Page(): JSX.Element {
  return (
    <div className="flex h-svh items-center justify-center">
      <SettingsDialog />
    </div>
  );
}
