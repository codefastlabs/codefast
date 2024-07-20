'use client';

import { type HTMLAttributes, type JSX } from 'react';
import { Slideshow } from '@codefast/third-parties/slideshow';
import '@codefast/third-parties/slideshow.css';

type SlideshowWeddingProps = HTMLAttributes<HTMLDivElement>;

export function SlideshowWedding({ ...props }: SlideshowWeddingProps): JSX.Element {
  return (
    <Slideshow
      options={{
        slides: [
          { src: '/slideshow/assorted-flowers-bouquet.jpg' },
          { src: '/slideshow/ellie-cooper-unsplash.jpg' },
          { src: '/slideshow/grayscale-bride-groom.jpg' },
          { src: '/slideshow/london-wheelchair-photo.jpg' },
          { src: '/slideshow/man-woman-standing.jpg' },
          { src: '/slideshow/nighttime-party.jpg' },
          { src: '/slideshow/tall-buildings-and-trees.jpg' },
          { src: '/slideshow/tall-buildings-street.jpg' },
          { src: '/slideshow/tiles-wall-photo.jpg' },
          { src: '/slideshow/waterfall-canyon-aerial.jpg' },
          { src: '/slideshow/wedding-bouquet-on-couch.jpg' },
          { src: '/slideshow/wedding-reception-backyard.jpg' },
          { src: '/slideshow/white-flower-bouquet-photo.jpg' },
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
