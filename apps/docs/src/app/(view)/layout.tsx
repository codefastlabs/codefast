import type { JSX, ReactNode } from 'react';

import '@/app/(app)/themes.css';

export default function ViewLayout({ children }: Readonly<{ children: ReactNode }>): JSX.Element {
  return <>{children}</>;
}
