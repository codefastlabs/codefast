import type { JSX } from 'react';

import { Badge } from '@codefast/ui';
import { AlertCircleIcon, ArrowRightIcon, CheckIcon } from 'lucide-react';
import Link from 'next/link';

import { GridWrapper } from '@/components/grid-wrapper';

export function BadgeDemo(): JSX.Element {
  return (
    <GridWrapper className="*:grid *:place-items-center">
      <div className="">
        <Badge>Badge</Badge>
      </div>
      <div className="">
        <Badge variant="secondary">Secondary</Badge>
      </div>
      <div className="">
        <Badge variant="destructive">Destructive</Badge>
      </div>
      <div className="">
        <Badge variant="outline">Outline</Badge>
      </div>
      <div className="">
        <Badge variant="outline">
          <CheckIcon />
          Badge
        </Badge>
      </div>
      <div className="">
        <Badge variant="destructive">
          <AlertCircleIcon />
          Alert
        </Badge>
      </div>
      <div className="">
        <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums">8</Badge>
      </div>
      <div className="">
        <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums" variant="destructive">
          99
        </Badge>
      </div>
      <div className="">
        <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums" variant="outline">
          20+
        </Badge>
      </div>
      <div className="">
        <Badge asChild>
          <Link href="/#badge">
            Link <ArrowRightIcon />
          </Link>
        </Badge>
      </div>
      <div className="">
        <Badge asChild variant="secondary">
          <Link href="/#badge">
            Link <ArrowRightIcon />
          </Link>
        </Badge>
      </div>
      <div className="">
        <Badge asChild variant="destructive">
          <Link href="/#badge">
            Link <ArrowRightIcon />
          </Link>
        </Badge>
      </div>
      <div className="">
        <Badge asChild variant="outline">
          <Link href="/#badge">
            Link <ArrowRightIcon />
          </Link>
        </Badge>
      </div>
    </GridWrapper>
  );
}
