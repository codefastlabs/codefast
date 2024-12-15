import type { Metadata } from 'next';
import type { JSX } from 'react';

import { SlideshowWedding } from '@/app/examples/slideshow/_components/slideshow-wedding';

export const metadata: Metadata = {
  title: 'Slideshow',
};

export default function SlideshowPage(): JSX.Element {
  return (
    <main>
      <SlideshowWedding className="h-[calc(100vh-61px)]" />
    </main>
  );
}
