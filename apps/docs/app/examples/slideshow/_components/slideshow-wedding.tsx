'use client';

import { Slideshow } from '@codefast/third-parties/slideshow';
import { type HTMLAttributes, type JSX } from 'react';
import '@codefast/third-parties/slideshow.css';

type SlideshowWeddingProps = HTMLAttributes<HTMLDivElement>;

export function SlideshowWedding({
  ...props
}: SlideshowWeddingProps): JSX.Element {
  return (
    <Slideshow
      options={{
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
        overlay: true,
        transition: 'zoomOut',
        animation: 'kenburnsDown',
        transitionDuration: 2000,
        delay: 10000,
        animationDuration: 20000,
        shuffle: true,
      }}
      {...props}
    />
  );
}
