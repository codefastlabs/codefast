import type { JSX } from "react";

import { ArrowRightIcon, SendIcon } from "lucide-react";

import { GridWrapper } from "@/components/grid-wrapper";
import { Button, Spinner } from "@codefast/ui";

export function ButtonDemo(): JSX.Element {
  return (
    <GridWrapper className="*:grid *:place-items-center *:gap-6">
      <div>
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
        <Button size="sm" variant="outline">
          <SendIcon />
          Send
        </Button>
        <Button size="sm" variant="outline">
          Learn More
          <ArrowRightIcon />
        </Button>
        <Button disabled size="sm" variant="outline">
          <Spinner className="size-4" />
          Please wait
        </Button>
      </div>
      <div>
        <Button>Medium</Button>
        <Button variant="outline">Outline</Button>
        <Button aria-invalid variant="outline">
          Outline
        </Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="link">Link</Button>
        <Button variant="outline">
          <SendIcon />
          Send
        </Button>
        <Button variant="outline">
          Learn More
          <ArrowRightIcon />
        </Button>
        <Button disabled variant="outline">
          <Spinner className="size-4" />
          Please wait
        </Button>
      </div>
      <div>
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
        <Button size="lg" variant="outline">
          <SendIcon />
          Send
        </Button>
        <Button size="lg" variant="outline">
          Learn More
          <ArrowRightIcon />
        </Button>
        <Button disabled size="lg" variant="outline">
          <Spinner className="size-4" />
          Please wait
        </Button>
      </div>
    </GridWrapper>
  );
}
