import { type JSX, type ReactNode } from 'react';
import { ExamplesNavigation } from '@/components/examples-navigation';

export default function ExamplesLayout({ children }: Readonly<{ children: ReactNode }>): JSX.Element {
  return (
    <section className="divide-y">
      <div className="px-4 py-2">
        <ExamplesNavigation />
      </div>

      {children}
    </section>
  );
}
