import type { ComponentProps, JSX } from 'react';

import { CheckboxGroup, CheckboxGroupItem, cn, Label } from '@codefast/ui';

export function CheckboxGroupDemo({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return (
    <div className={cn('', className)} {...props}>
      <CheckboxGroup defaultValue={['comfortable']}>
        <div className="flex items-center gap-3">
          <CheckboxGroupItem id="checkbox-group-1" value="default" />

          <Label htmlFor="checkbox-group-1">Default</Label>
        </div>

        <div className="flex items-center gap-3">
          <CheckboxGroupItem id="checkbox-group-2" value="comfortable" />

          <Label htmlFor="checkbox-group-2">Comfortable</Label>
        </div>

        <div className="flex items-center gap-3">
          <CheckboxGroupItem id="checkbox-group-3" value="compact" />

          <Label htmlFor="checkbox-group-3">Compact</Label>
        </div>

        <div className="flex items-center gap-3">
          <CheckboxGroupItem disabled id="checkbox-group-4" value="disabled" />

          <Label htmlFor="checkbox-group-4">Disabled</Label>
        </div>
      </CheckboxGroup>
    </div>
  );
}
