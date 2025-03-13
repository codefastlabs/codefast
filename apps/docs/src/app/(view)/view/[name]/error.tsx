'use client';

import type { JSX } from 'react';

import { logger } from '@codefast/ui';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  useEffect(() => {
    // Log the error to an error reporting service
    logger.error(error);
  }, [error]);

  return (
    <div>
      <h2 className="p-4 text-red-500">Something went wrong!</h2>
      <button
        type="button"
        onClick={() => {
          reset();
        }}
      >
        Try again
      </button>
    </div>
  );
}
