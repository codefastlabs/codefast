import { type Metadata } from 'next';
import { type JSX } from 'react';
import { Slideshow } from '@codefast/third-parties/slideshow';
import '@codefast/third-parties/slideshow.css';

export const metadata: Metadata = {
  title: 'Slideshow',
};

export default function SlideshowPage(): JSX.Element {
  return (
    <main>
      <Slideshow
        className="h-[calc(100vh-61px)]"
        options={{
          slides: [
            { src: '/slideshow/tall-buildings-and-trees.jpg' },
            { src: '/slideshow/tall-buildings-street.jpg' },
            { src: '/slideshow/tiles-wall-photo.jpg' },
            { src: '/slideshow/waterfall-canyon-aerial.jpg' },
          ],
          overlay: true,
          transition: 'zoomOut',
          animation: 'kenburnsDown',
          transitionDuration: 2000,
          delay: 10000,
          animationDuration: 20000,
        }}
      />
    </main>
  );
}
