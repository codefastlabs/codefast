import { TooltipProvider } from '@codefast/ui';
import { type JSX, type ReactNode } from 'react';
import { ExamplesNavigation } from '@/components/examples-navigation';

export default function ExamplesLayout({
  children,
}: Readonly<{ children: ReactNode }>): JSX.Element {
  return (
    <TooltipProvider delayDuration={0}>
      <section className="divide-y">
        <div className="px-4 py-2">
          <ExamplesNavigation />
        </div>

        {children}
      </section>
    </TooltipProvider>
  );
}
