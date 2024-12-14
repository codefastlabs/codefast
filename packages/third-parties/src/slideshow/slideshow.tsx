'use client';

import { type JSX, useEffect, useRef } from 'react';

import { type VegasSettings } from '@/slideshow/_lib/types';
import { Vegas } from '@/slideshow/_lib/vegas';
import '@/slideshow/_styles/sass/vegas.sass';

interface SlideshowProps {
  options: Partial<VegasSettings>;
  className?: string;
}

export function Slideshow({ options, ...props }: SlideshowProps): JSX.Element {
  const slideshowRef = useRef<HTMLDivElement>(null);
  const vegasRef = useRef<null | Vegas>(null);

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
