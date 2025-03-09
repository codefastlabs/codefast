import type { JSX } from 'react';

import { Button } from '@codefast/ui';
import { ArrowRightIcon, SendIcon } from 'lucide-react';

export function ButtonDemo(): JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2 md:flex-row">
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

      <div className="flex flex-wrap items-center gap-2 md:flex-row">
        <Button size="2xs">Tiny</Button>

        <Button size="2xs" variant="outline">
          Outline
        </Button>

        <Button size="2xs" variant="ghost">
          Ghost
        </Button>

        <Button size="2xs" variant="destructive">
          Destructive
        </Button>

        <Button size="2xs" variant="secondary">
          Secondary
        </Button>

        <Button size="2xs" variant="link">
          Link
        </Button>

        <Button prefix={<SendIcon />} size="2xs" variant="outline">
          Send
        </Button>

        <Button size="2xs" suffix={<ArrowRightIcon />} variant="outline">
          Learn More
        </Button>

        <Button disabled loading size="2xs" variant="outline">
          Please wait
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:flex-row">
        <Button size="xs">Extra Small</Button>

        <Button size="xs" variant="outline">
          Outline
        </Button>

        <Button size="xs" variant="ghost">
          Ghost
        </Button>

        <Button size="xs" variant="destructive">
          Destructive
        </Button>

        <Button size="xs" variant="secondary">
          Secondary
        </Button>

        <Button size="xs" variant="link">
          Link
        </Button>

        <Button prefix={<SendIcon />} size="xs" variant="outline">
          Send
        </Button>

        <Button size="xs" suffix={<ArrowRightIcon />} variant="outline">
          Learn More
        </Button>

        <Button disabled loading size="xs" variant="outline">
          Please wait
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:flex-row">
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

      <div className="flex flex-wrap items-center gap-2 md:flex-row">
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

      <div className="flex flex-wrap items-center gap-2 md:flex-row">
        <Button size="xl">Extra Large</Button>

        <Button size="xl" variant="outline">
          Outline
        </Button>

        <Button size="xl" variant="ghost">
          Ghost
        </Button>

        <Button size="xl" variant="destructive">
          Destructive
        </Button>

        <Button size="xl" variant="secondary">
          Secondary
        </Button>

        <Button size="xl" variant="link">
          Link
        </Button>

        <Button prefix={<SendIcon />} size="xl" variant="outline">
          Send
        </Button>

        <Button size="xl" suffix={<ArrowRightIcon />} variant="outline">
          Learn More
        </Button>

        <Button disabled loading size="xl" variant="outline">
          Please wait
        </Button>
      </div>
    </div>
  );
}
