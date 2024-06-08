'use client';

import { Provider as JotaiProvider } from 'jotai';
import type { JSX, ReactNode } from 'react';

interface ProvidersProps {
  children?: ReactNode | undefined;
}

export function Providers({ children }: ProvidersProps): JSX.Element {
  return <JotaiProvider>{children}</JotaiProvider>;
}
