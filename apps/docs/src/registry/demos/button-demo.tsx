import type { JSX } from 'react';

import { Button } from '@codefast/ui';
import { ArrowRightIcon, SendIcon } from 'lucide-react';

export function ButtonDemo(): JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2 md:flex-row">
        <Button size="sm">Small</Button>

        <Button size="sm" variant="outline">
          Outline
        </Button>

        <Button size="sm" variant="ghost">
          Ghost
        </Button>

        <Button size="sm" variant="destructive">
          Destructive
        </Button>

        <Button size="sm" variant="secondary">
          Secondary
        </Button>

        <Button size="sm" variant="link">
          Link
        </Button>

        <Button prefix={<SendIcon />} size="sm" variant="outline">
          Send
        </Button>

        <Button size="sm" suffix={<ArrowRightIcon />} variant="outline">
          Learn More
        </Button>

        <Button disabled loading size="sm" variant="outline">
          Please wait
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 md:flex-row">
        <Button>Medium</Button>

        <Button variant="outline">Outline</Button>

        <Button variant="ghost">Ghost</Button>

        <Button variant="destructive">Destructive</Button>

        <Button variant="secondary">Secondary</Button>

        <Button variant="link">Link</Button>

        <Button prefix={<SendIcon />} variant="outline">
          Send
        </Button>

        <Button suffix={<ArrowRightIcon />} variant="outline">
          Learn More
        </Button>

        <Button disabled loading variant="outline">
          Please wait
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 md:flex-row">
        <Button size="lg">Large</Button>

        <Button size="lg" variant="outline">
          Outline
        </Button>

        <Button size="lg" variant="ghost">
          Ghost
        </Button>

        <Button size="lg" variant="destructive">
          Destructive
        </Button>

        <Button size="lg" variant="secondary">
          Secondary
        </Button>

        <Button size="lg" variant="link">
          Link
        </Button>

        <Button prefix={<SendIcon />} size="lg" variant="outline">
          Send
        </Button>

        <Button size="lg" suffix={<ArrowRightIcon />} variant="outline">
          Learn More
        </Button>

        <Button disabled loading size="lg" variant="outline">
          Please wait
        </Button>
      </div>
    </div>
  );
}
