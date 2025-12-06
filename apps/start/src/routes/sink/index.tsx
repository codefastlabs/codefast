import { Suspense } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Skeleton } from '@codefast/ui/skeleton';
import { componentRegistry } from '@/components/sink/component-registry';
import { ComponentWrapper } from '@/components/sink/app/component-wrapper';

export const Route = createFileRoute('/sink/')({
  component: SinkPage,
  head: () => ({
    meta: [
      { title: 'Kitchen Sink' },
      { name: 'description', content: 'A page with all components for testing purposes.' },
    ],
  }),
});

function SinkPage() {
  return (
    <div className="@container grid flex-1 gap-4 p-4">
      {Object.entries(componentRegistry)
        .filter(
          (entry): entry is [string, NonNullable<(typeof componentRegistry)[string]>] =>
            entry[1] != null && entry[1].type === 'registry:ui',
        )
        .map(([key, component]) => {
          const Component = component.component;

          return (
            <ComponentWrapper key={key} name={key} className={component.className ?? ''}>
              <Suspense fallback={<Skeleton className="h-20 w-full" />}>
                <Component />
              </Suspense>
            </ComponentWrapper>
          );
        })}
    </div>
  );
}

