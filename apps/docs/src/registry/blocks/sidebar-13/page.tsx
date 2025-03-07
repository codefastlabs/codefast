import type { JSX } from 'react';

import { SettingsDialog } from '@/registry/blocks/sidebar-13/components/settings-dialog';

export default function Page(): JSX.Element {
  return (
    <div className="flex h-svh items-center justify-center">
      <SettingsDialog />
    </div>
  );
}
