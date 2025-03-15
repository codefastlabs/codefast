import type { ComponentProps, JSX } from 'react';

import { cn, Label, Radio } from '@codefast/ui';

export function RadioDemo({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return (
    <div className={cn('grid gap-2', className)} {...props}>
      <div className="flex items-center gap-3">
        <Radio defaultChecked id="radio-1" name="example" value="1" />
        <Label htmlFor="radio-1">Default</Label>
      </div>
      <div className="flex items-center gap-3">
        <Radio id="radio-2" name="example" value="2" />
        <Label htmlFor="radio-2">Comfortable</Label>
      </div>
      <div className="flex items-center gap-3">
        <Radio id="radio-3" name="example" value="3" />
        <Label htmlFor="radio-3">Compact</Label>
      </div>
      <div className="flex items-center gap-3">
        <Radio disabled id="radio-4" name="example" value="4" />
        <Label htmlFor="radio-4">Disabled</Label>
      </div>
    </div>
  );
}
