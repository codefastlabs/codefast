import type { JSX } from 'react';

import { AspectRatio } from '@codefast/ui';
import Image from 'next/image';

import { GridWrapper } from '@/components/grid-wrapper';

export function AspectRatioDemo(): JSX.Element {
  return (
    <GridWrapper>
      <div className="">
        <AspectRatio className="bg-muted rounded-lg" ratio={16 / 9}>
          <Image
            fill
            alt="Photo by Drew Beamer"
            className="h-full w-full rounded-lg object-cover dark:brightness-[0.2] dark:grayscale"
            src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
          />
        </AspectRatio>
      </div>
      <div className="">
        <AspectRatio className="bg-muted rounded-lg" ratio={4 / 3}>
          <Image
            fill
            alt="Photo by Drew Beamer"
            className="h-full w-full rounded-lg object-cover dark:brightness-[0.2] dark:grayscale"
            src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
          />
        </AspectRatio>
      </div>
      <div className="">
        <AspectRatio className="bg-muted rounded-lg" ratio={1}>
          <Image
            fill
            alt="Photo by Drew Beamer"
            className="h-full w-full rounded-lg object-cover dark:brightness-[0.2] dark:grayscale"
            src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
          />
        </AspectRatio>
      </div>
    </GridWrapper>
  );
}
