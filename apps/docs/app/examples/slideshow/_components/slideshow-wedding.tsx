'use client';

import type { HTMLAttributes, JSX } from 'react';

import '@codefast/third-parties/slideshow.css';
import { Slideshow } from '@codefast/third-parties/slideshow';

type SlideshowWeddingProps = HTMLAttributes<HTMLDivElement>;

export function SlideshowWedding({ ...props }: SlideshowWeddingProps): JSX.Element {
  return (
    <Slideshow
      options={{
        animation: 'kenburnsDown',
        animationDuration: 20_000,
        delay: 10_000,
        overlay: true,
        shuffle: true,
        slides: [
          { src: '/slideshow/london-wheelchair-photo.webp' },
          { src: '/slideshow/man-woman-standing.webp' },
          { src: '/slideshow/nighttime-party.webp' },
          { src: '/slideshow/tall-buildings-and-trees.webp' },
          { src: '/slideshow/tall-buildings-street.webp' },
          { src: '/slideshow/tiles-wall-photo.webp' },
          { src: '/slideshow/waterfall-canyon-aerial.webp' },
          { src: '/slideshow/wedding-reception-backyard.webp' },
        ],
        transition: 'zoomOut',
        transitionDuration: 2000,
      }}
      {...props}
    />
  );
}
