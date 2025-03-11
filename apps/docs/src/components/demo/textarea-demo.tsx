import type { JSX } from 'react';

import { Label, Textarea } from '@codefast/ui';

import { GridWrapper } from '@/components/grid-wrapper';

export function TextareaDemo(): JSX.Element {
  return (
    <GridWrapper>
      <div>
        <Textarea placeholder="Type your message here." />
      </div>

      <div>
        <Textarea aria-invalid="true" placeholder="Type your message here." />
      </div>

      <div>
        <div className="grid gap-2">
          <Label htmlFor="textarea-demo-message">Label</Label>

          <Textarea id="textarea-demo-message" placeholder="Type your message here." rows={6} />
        </div>
      </div>

      <div>
        <div className="grid gap-2">
          <Label htmlFor="textarea-demo-message-2">With label and description</Label>

          <Textarea id="textarea-demo-message-2" placeholder="Type your message here." rows={6} />

          <div className="text-muted-foreground text-sm">Type your message and press enter to send.</div>
        </div>
      </div>

      <div>
        <div className="grid gap-2">
          <Label htmlFor="textarea-demo-disabled">Disabled</Label>

          <Textarea disabled id="textarea-demo-disabled" placeholder="Type your message here." />
        </div>
      </div>
    </GridWrapper>
  );
}
