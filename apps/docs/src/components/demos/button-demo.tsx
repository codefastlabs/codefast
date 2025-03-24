import type { JSX } from 'react';

import { Button } from '@codefast/ui';
import { ArrowRightIcon, SendIcon } from 'lucide-react';

import { GridWrapper } from '@/components/grid-wrapper';

export function ButtonDemo(): JSX.Element {
  return (
    <GridWrapper>
      <div className="grid place-items-center gap-6">
        <Button size="sm">Small</Button>
        <Button size="sm" variant="outline">
          Outline
        </Button>
        <Button aria-invalid size="sm" variant="outline">
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
      <div className="grid place-items-center gap-6">
        <Button>Medium</Button>
        <Button variant="outline">Outline</Button>
        <Button aria-invalid variant="outline">
          Outline
        </Button>
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
      <div className="grid place-items-center gap-6">
        <Button size="lg">Large</Button>
        <Button size="lg" variant="outline">
          Outline
        </Button>
        <Button aria-invalid size="lg" variant="outline">
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
    </GridWrapper>
  );
}
