import type { ComponentProps, JSX } from 'react';

import { CheckboxCards, CheckboxCardsItem, cn } from '@codefast/ui';

export function CheckboxCardsDemo({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return (
    <div className={cn('', className)} {...props}>
      <CheckboxCards className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" defaultValue={['1']}>
        <CheckboxCardsItem value="1">
          <div className="grid gap-1.5 font-normal">
            <p className="text-sm font-medium leading-none">Enable notifications</p>
            <p className="text-muted-foreground text-sm">You can enable or disable notifications at any time.</p>
          </div>
        </CheckboxCardsItem>
        <CheckboxCardsItem value="2">
          <div className="grid gap-1.5 font-normal">
            <p className="text-sm font-medium leading-none">Dark mode</p>
            <p className="text-muted-foreground text-sm">Switch between light and dark mode preferences.</p>
          </div>
        </CheckboxCardsItem>
        <CheckboxCardsItem value="3">
          <div className="grid gap-1.5 font-normal">
            <p className="text-sm font-medium leading-none">Automatic updates</p>
            <p className="text-muted-foreground text-sm">Keep your system up to date with latest features.</p>
          </div>
        </CheckboxCardsItem>
        <CheckboxCardsItem disabled value="4">
          <div className="grid gap-1.5 font-normal">
            <p className="text-sm font-medium leading-none">Data analytics</p>
            <p className="text-muted-foreground text-sm">Help us improve by sharing anonymous usage data.</p>
          </div>
        </CheckboxCardsItem>
        <CheckboxCardsItem value="5">
          <div className="grid gap-1.5 font-normal">
            <p className="text-sm font-medium leading-none">Cloud sync</p>
            <p className="text-muted-foreground text-sm">Synchronize your settings across multiple devices.</p>
          </div>
        </CheckboxCardsItem>
        <CheckboxCardsItem value="6">
          <div className="grid gap-1.5 font-normal">
            <p className="text-sm font-medium leading-none">Remember sessions</p>
            <p className="text-muted-foreground text-sm">Resume your work exactly where you left off.</p>
          </div>
        </CheckboxCardsItem>
      </CheckboxCards>
    </div>
  );
}
