'use client';

import * as React from 'react';
import '@/slideshow/_lib/vegas/sass/vegas.sass';
import { Vegas, type VegasSettings } from '@/slideshow/_lib/vegas/vegas';

interface SlideshowProps {
  options: Partial<VegasSettings>;
  className?: string;
}

export function Slideshow({ options, ...props }: SlideshowProps): React.JSX.Element {
  const slideshowRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (slideshowRef.current) {
      const vegas = new Vegas(slideshowRef.current, options);

      // Cleanup on unmounting
      return () => {
        vegas.destroy();
      };
    }
  }, [options]);

  return <div ref={slideshowRef} {...props} />;
}
