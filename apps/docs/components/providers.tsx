'use client';

import { type JSX, type ReactNode } from 'react';
import { Provider as JotaiProvider } from 'jotai';

interface ProvidersProps {
  children?: ReactNode | undefined;
}

export function Providers({ children }: ProvidersProps): JSX.Element {
  return <JotaiProvider>{children}</JotaiProvider>;
}
