import { Suspense, useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Skeleton } from '@codefast/ui/skeleton';
import { ComponentWrapper } from '@/components/sink/app/component-wrapper';
import { componentRegistry } from '@/components/sink/component-registry';

export const Route = createFileRoute('/sink/')({
  component: SinkPage,
  head: () => ({
    meta: [
      { title: 'Kitchen Sink' },
      { name: 'description', content: 'A page with all components for testing purposes.' },
    ],
  }),
});

function LazyComponentItem({
  componentKey,
  config,
}: {
  componentKey: string;
  config: (typeof componentRegistry)[string];
}) {
  const Component = config.component;

  return (
    <ComponentWrapper name={componentKey} className={config.className ?? ''}>
      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <Component />
      </Suspense>
    </ComponentWrapper>
  );
}

function SinkPage() {
  const uiComponents = useMemo(
    () =>
      Object.entries(componentRegistry).filter(([, component]) => {
        return component.type === 'registry:ui';
      }),
    [],
  );

  return (
    <div className="@container grid flex-1 gap-4 p-4">
      {uiComponents.map(([key, component]) => (
        <LazyComponentItem key={key} componentKey={key} config={component} />
      ))}
    </div>
  );
}
