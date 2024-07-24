'use client';

import * as React from 'react';
import '@/slideshow/_lib/vegas/sass/vegas.sass';
import { Vegas } from '@/slideshow/_lib/vegas/vegas';
import { type VegasSettings } from '@/slideshow/_lib/vegas/types';

interface SlideshowProps {
  options: Partial<VegasSettings>;
  className?: string;
}

export function Slideshow({ options, ...props }: SlideshowProps): React.JSX.Element {
  const slideshowRef = React.useRef<HTMLDivElement>(null);
  const vegasRef = React.useRef<Vegas>();

  React.useEffect(() => {
    if (!slideshowRef.current || vegasRef.current) {
      return;
    }

    vegasRef.current = new Vegas(slideshowRef.current, options);

    // Cleanup on unmounting
    return () => {
      vegasRef.current?.destroy();
    };
  }, [options]);

  return <div ref={slideshowRef} {...props} />;
}
