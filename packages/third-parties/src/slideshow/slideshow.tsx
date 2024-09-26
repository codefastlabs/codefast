'use client';

import * as React from 'react';
import '@/slideshow/_styles/sass/vegas.sass';
import { Vegas } from '@/slideshow/_lib/vegas';
import { type VegasSettings } from '@/slideshow/_lib/types';

interface SlideshowProps {
  options: Partial<VegasSettings>;
  className?: string;
}

export function Slideshow({ options, ...props }: SlideshowProps): React.JSX.Element {
  const slideshowRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!slideshowRef.current) {
      return;
    }

    const vegas = new Vegas(slideshowRef.current, options);

    vegas.init();

    // Cleanup on unmounting
    return () => {
      vegas.destroy();
    };
  }, [options]);

  return <div ref={slideshowRef} {...props} />;
}
