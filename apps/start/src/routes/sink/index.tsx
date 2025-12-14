import { createFileRoute } from '@tanstack/react-router';
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

function SinkPage() {
  return (
    <div className="@container grid flex-1 gap-4 p-4">
      {Object.entries(componentRegistry)
        .filter(([, component]) => {
          return component.type === 'registry:ui';
        })
        .map(([key, component]) => {
          const Component = component.component;
          return (
            <ComponentWrapper key={key} name={key} className={component.className || ''}>
              <Component />
            </ComponentWrapper>
          );
        })}
    </div>
  );
}
