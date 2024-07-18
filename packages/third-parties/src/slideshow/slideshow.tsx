'use client';

import * as React from 'react';
import { Slideshow as SlideshowMaster, type SlideshowSettings } from '@/slideshow/lib/slideshow';
import '@/slideshow/sass/slideshow.sass';

interface VegasProps {
  options: Partial<SlideshowSettings>;
}

export function Slideshow({ options }: VegasProps): React.JSX.Element {
  const slideshowRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (slideshowRef.current) {
      const slideshowInstance = new SlideshowMaster(slideshowRef.current, options);

      // Cleanup on unmounting
      return () => {
        slideshowInstance.destroySlideshow();
      };
    }
  }, [options]);

  return <div ref={slideshowRef} className="slideshow-element" />;
}
