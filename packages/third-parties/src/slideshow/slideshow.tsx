'use client';

import { type VegasSettings } from '@/slideshow/_lib/types';
import { Vegas } from '@/slideshow/_lib/vegas';
import '@/slideshow/_styles/sass/vegas.sass';
import { type JSX, useEffect, useRef } from 'react';

interface SlideshowProps {
  options: Partial<VegasSettings>;
  className?: string;
}

export function Slideshow({ options, ...props }: SlideshowProps): JSX.Element {
  const slideshowRef = useRef<HTMLDivElement>(null);
  const vegasRef = useRef<Vegas | null>(null);

  useEffect(() => {
    if (!slideshowRef.current || vegasRef.current) {
      return;
    }

    const vegas = new Vegas(slideshowRef.current, options);

    vegasRef.current = vegas;

    return () => {
      vegas.destroy();
    };
  }, [options]);

  return <div ref={slideshowRef} {...props} />;
}
