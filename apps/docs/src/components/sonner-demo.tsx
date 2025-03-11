'use client';

import type { JSX } from 'react';

import { Button, logger, toast } from '@codefast/ui';

export function SonnerDemo(): JSX.Element {
  return (
    <Button
      variant="outline"
      onClick={() =>
        toast('Event has been created', {
          description: 'Sunday, December 03, 2023 at 9:00 AM',
          action: {
            label: 'Undo',
            onClick: () => {
              logger.log('Undo');
            },
          },
        })
      }
    >
      Show Toast
    </Button>
  );
}
