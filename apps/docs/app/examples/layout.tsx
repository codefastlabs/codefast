import { ExamplesNav } from '@/components/examples-nav';
import type { JSX, ReactNode } from 'react';

export default function ExamplesLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <section className="divide-y">
      <div className="px-4 py-2">
        <ExamplesNav />
      </div>

      {children}
    </section>
  );
}
